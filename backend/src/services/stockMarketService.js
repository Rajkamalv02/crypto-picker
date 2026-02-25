const axios = require("axios");
const logger = require("../utils/logger");

// Expanded list including Nifty 50 and some mid/small cap stocks for better price range coverage
const STOCK_SYMBOLS = [
  // Nifty 50 (High-priced)
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "INFY.NS",
  "SBIN.NS",
  "BHARTIARTL.NS",
  "ITC.NS",
  "KOTAKBANK.NS",
  "LT.NS",
  "AXISBANK.NS",
  "HINDUNILVR.NS",
  "ASIANPAINT.NS",
  "MARUTI.NS",
  "SUNPHARMA.NS",
  "TITAN.NS",
  "BAJFINANCE.NS",
  "ULTRACEMCO.NS",
  "WIPRO.NS",
  "M&M.NS",
  "NTPC.NS",
  "HCLTECH.NS",
  "JSWSTEEL.NS",
  "TATASTEEL.NS",
  "POWERGRID.NS",
  "ADANIENT.NS",
  "ADANIPORTS.NS",
  "COALINDIA.NS",
  "GRASIM.NS",
  "BAJAJ-AUTO.NS",

  // Mid/Small Cap (More affordable - typically ₹50-500 range)
  "YESBANK.NS",
  "SUZLON.NS",
  "TATAMOTORS.NS",
  "SAIL.NS",
  "NMDC.NS",
  "VEDL.NS",
  "ZEEL.NS",
  "IDEA.NS",
  "PNB.NS",
  "BANKBARODA.NS",
  "CANBK.NS",
  "INDUSINDBK.NS",
  "ONGC.NS",
  "BPCL.NS",
  "IOC.NS",
  "HINDALCO.NS",
  "JINDALSTEL.NS",
  "TATAPOWER.NS",
  "RECLTD.NS",
  "PFC.NS",
];

// Fallback image for stocks
const DEFAULT_STOCK_IMAGE =
  "https://s3-symbol-logo.tradingview.com/indices/nifty-50.svg";

const fetchMarketData = async (options = {}) => {
  try {
    const { page = 1, limit = 5, minPrice, maxPrice, search = "" } = options;

    const trimmedSearch = search.trim().toLowerCase();

    // Yahoo Finance v8 API only supports one symbol at a time reliably without key
    // We will fetch stock symbols in parallel
    const fetchPromises = STOCK_SYMBOLS.map((symbol) =>
      axios
        .get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
          params: { range: "1d", interval: "1d" },
          timeout: 5000,
        })
        .catch((err) => {
          logger.error(`Error fetching ${symbol}: ${err.message}`);
          return null;
        }),
    );

    const responses = await Promise.all(fetchPromises);

    const rawData = responses
      .filter(
        (res) => res && res.data && res.data.chart && res.data.chart.result,
      )
      .map((res) => {
        const result = res.data.chart.result[0];
        const meta = result.meta;
        return {
          symbol: meta.symbol,
          fullName: meta.symbol.replace(".NS", ""), // v8 meta doesn't always have longName
          price: meta.regularMarketPrice,
          high24h: meta.dayHigh || meta.regularMarketPrice,
          low24h: meta.dayLow || meta.regularMarketPrice,
          volume24h: meta.regularMarketVolume || 0,
          changePct24h:
            ((meta.regularMarketPrice - meta.chartPreviousClose) /
              meta.chartPreviousClose) *
            100,
          image: DEFAULT_STOCK_IMAGE,
        };
      });

    // Filter and transform data
    let filteredData = rawData
      .filter((stock) => {
        // Price filtering only if provided - ensure proper number parsing
        const matchesMinPrice =
          minPrice !== undefined ? stock.price >= parseFloat(minPrice) : true;
        const matchesMaxPrice =
          maxPrice !== undefined ? stock.price <= parseFloat(maxPrice) : true;

        const matchesSearch =
          !trimmedSearch ||
          stock.symbol.toLowerCase().includes(trimmedSearch) ||
          stock.fullName.toLowerCase().includes(trimmedSearch);

        return matchesMinPrice && matchesMaxPrice && matchesSearch;
      })
      .sort((a, b) => b.volume24h - a.volume24h);

    const totalCount = filteredData.length;
    logger.info(
      `Filtering stocks: minPrice=${minPrice}, maxPrice=${maxPrice}, search=${search}. Found ${totalCount} out of ${rawData.length} stocks.`,
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(
      startIndex,
      startIndex + parseInt(limit),
    );

    logger.info(
      `Successfully fetched ${totalCount} stocks using v8 API, returning page ${page}`,
    );

    return {
      assets: paginatedData,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error("Error fetching stock market data:", error.message);
    throw error;
  }
};

const getAssetDetails = async (symbol) => {
  try {
    logger.info(`Fetching details for stock: ${symbol}`);
    const response = await axios.get(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: { range: "1d", interval: "1d" },
      },
    );

    if (!response.data || !response.data.chart || !response.data.chart.result) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const meta = response.data.chart.result[0].meta;

    return {
      symbol: meta.symbol,
      fullName: meta.symbol.replace(".NS", ""),
      price: meta.regularMarketPrice,
      high24h: meta.dayHigh || meta.regularMarketPrice,
      low24h: meta.dayLow || meta.regularMarketPrice,
      volume24h: meta.regularMarketVolume || 0,
      changePct24h:
        ((meta.regularMarketPrice - meta.chartPreviousClose) /
          meta.chartPreviousClose) *
        100,
      image: DEFAULT_STOCK_IMAGE,
    };
  } catch (error) {
    logger.error(`Error fetching stock details for ${symbol}:`, error.message);
    throw error;
  }
};

const fetchHistoricalData = async (symbol, range = "1mo", interval = "1h") => {
  try {
    logger.info(
      `Fetching historical data for ${symbol}, range: ${range}, interval: ${interval}`,
    );
    // Yahoo Finance v8 chart endpoint
    const response = await axios.get(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: {
          range: range,
          interval: interval,
        },
      },
    );

    if (!response.data || !response.data.chart || !response.data.chart.result) {
      throw new Error("Failed to fetch historical data from Yahoo Finance");
    }

    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    // Transform to match existing format: {time, close, high, low, open, volumefrom, volumeto}
    return timestamps
      .map((time, i) => ({
        time: time,
        close: quotes.close[i],
        high: quotes.high[i],
        low: quotes.low[i],
        open: quotes.open[i],
        volume: quotes.volume[i],
      }))
      .filter((d) => d.close !== null); // Filter out any null entries
  } catch (error) {
    logger.error(
      `Error fetching historical data for ${symbol}:`,
      error.message,
    );
    throw error;
  }
};

const RECENT_STOCK_SYMBOLS = [
  "GAUDIUM.NS",
  "MANILAM.NS",
  "YASHTEJ.NS",
  "BCCL.NS",
  "ACCORD.NS",
  "MOBILISE.NS",
  "GROVER.NS",
  "BRANDMAN.NS",
  "BIOPOL.NS",
];

const fetchRecentlyListed = async (options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    logger.info(`Fetching recently listed stocks, limit: ${limit}`);

    const fetchPromises = RECENT_STOCK_SYMBOLS.map((symbol) =>
      axios
        .get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
          params: { range: "1d", interval: "1m" }, // Changed to 1m for more granular check
          timeout: 10000, // Increased timeout to 10s
        })
        .catch((err) => {
          logger.error(`Error fetching recent stock ${symbol}: ${err.message}`);
          return null;
        }),
    );

    const responses = await Promise.all(fetchPromises);

    const assets = responses
      .filter(
        (res) => res && res.data && res.data.chart && res.data.chart.result,
      )
      .map((res) => {
        const result = res.data.chart.result[0];
        const meta = result.meta;
        return {
          symbol: meta.symbol,
          fullName: meta.symbol.replace(".NS", ""),
          price: meta.regularMarketPrice,
          high24h: meta.dayHigh || meta.regularMarketPrice,
          low24h: meta.dayLow || meta.regularMarketPrice,
          volume24h: meta.regularMarketVolume || 0,
          changePct24h:
            ((meta.regularMarketPrice - meta.chartPreviousClose) /
              meta.chartPreviousClose) *
            100,
          image: DEFAULT_STOCK_IMAGE,
        };
      });

    return {
      assets: assets.slice(0, parseInt(limit)),
      total: assets.length,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error("Error fetching recently listed stocks:", error.message);
    throw error;
  }
};

module.exports = {
  fetchMarketData,
  getAssetDetails,
  fetchHistoricalData,
  fetchRecentlyListed,
};
