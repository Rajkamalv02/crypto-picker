const axios = require("axios");
const logger = require("../utils/logger");

const BASE_URL = "https://min-api.cryptocompare.com/data";
const API_KEY = process.env.CRYPTOCOMPARE_API_KEY;

const RECENT_CRYPTO_SYMBOLS = [
  "ESP",
  "HYPE",
  "KAS",
  "ULTI",
  "MSN",
  "MAXI",
  "SUBBD",
  "FART",
  "MNT",
  "TIA",
  "PYTH",
  "JUP",
];

// Helper to add API key to requests
const getAxiosConfig = (params = {}) => {
  if (API_KEY) {
    params.api_key = API_KEY;
  }
  return { params };
};

const fetchMarketData = async (options = {}) => {
  try {
    const { page = 1, limit = 5, minPrice, maxPrice, search = "" } = options;
    logger.info(
      `Fetching market data: page=${page}, limit=${limit}, search="${search}"`,
    );

    // Fetch multiple pages if needed to get enough filtered results
    const fetchPages = [0, 1];
    let responses;

    try {
      responses = await Promise.all(
        fetchPages.map((p) =>
          axios.get(`${BASE_URL}/top/mktcapfull`, {
            params: { limit: 100, tsym: "INR", page: p },
            timeout: 10000,
          }),
        ),
      );
    } catch (err) {
      logger.error("Error fetching from CryptoCompare:", err.message);
      throw err;
    }

    let allAssets = [];
    responses.forEach((res) => {
      if (res.data && Array.isArray(res.data.Data)) {
        const assets = res.data.Data.map((coin) => {
          if (!coin.RAW || !coin.RAW.INR) return null;
          return {
            symbol: coin.CoinInfo.Name,
            fullName: coin.CoinInfo.FullName,
            price: coin.RAW.INR.PRICE,
            high24h: coin.RAW.INR.HIGH24HOUR,
            low24h: coin.RAW.INR.LOW24HOUR,
            volume24h: coin.RAW.INR.VOLUME24HOURTO,
            image: `https://www.cryptocompare.com${coin.CoinInfo.ImageUrl}`,
          };
        }).filter((coin) => coin !== null);
        allAssets = [...allAssets, ...assets];
      }
    });

    // Apply Search
    if (search) {
      const searchLower = search.toLowerCase();
      allAssets = allAssets.filter(
        (a) =>
          a.symbol.toLowerCase().includes(searchLower) ||
          a.fullName.toLowerCase().includes(searchLower),
      );
    }

    // Apply Price Filters
    if (minPrice !== undefined)
      allAssets = allAssets.filter((a) => a.price >= minPrice);
    if (maxPrice !== undefined)
      allAssets = allAssets.filter((a) => a.price <= maxPrice);

    const total = allAssets.length;
    const startIndex = (page - 1) * limit;
    const paginatedAssets = allAssets.slice(startIndex, startIndex + limit);

    return {
      assets: paginatedAssets,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error("Error in fetchMarketData:", error.message);
    throw error;
  }
};

const getAssetDetails = async (symbol) => {
  try {
    const response = await axios.get(`${BASE_URL}/pricemultifull`, {
      params: { fsyms: symbol, tsyms: "INR" },
    });

    if (!response.data.RAW || !response.data.RAW[symbol]) {
      throw new Error(`Asset ${symbol} not found`);
    }

    const rawData = response.data.RAW[symbol].INR;
    const displayData = response.data.DISPLAY[symbol].INR;

    return {
      symbol: symbol,
      fullName: displayData.FROMSYMBOL,
      price: rawData.PRICE,
      high24h: rawData.HIGH24HOUR,
      low24h: rawData.LOW24HOUR,
      volume24h: rawData.VOLUME24HOURTO,
      changePct24h: rawData.CHANGEPCT24HOUR,
      image: `https://www.cryptocompare.com${displayData.IMAGEURL}`,
    };
  } catch (error) {
    logger.error(`Error fetching details for ${symbol}:`, error.message);
    throw error;
  }
};

const fetchHistoricalData = async (symbol, limit = 100) => {
  try {
    const response = await axios.get(`${BASE_URL}/v2/histohour`, {
      params: {
        fsym: symbol,
        tsym: "INR",
        limit: limit,
      },
    });

    if (response.data.Response === "Error") {
      throw new Error(response.data.Message);
    }

    return response.data.Data.Data;
  } catch (error) {
    logger.error(
      `Error fetching historical data for ${symbol}:`,
      error.message,
    );
    throw error;
  }
};

const fetchRecentlyListed = async (options = {}) => {
  try {
    const { limit = 10 } = options;
    logger.info(
      `Fetching curated recently listed crypto assets, limit: ${limit}`,
    );

    const symbols = RECENT_CRYPTO_SYMBOLS.slice(0, parseInt(limit));
    const symbolsWithUsdt = [...symbols, "USDT"].join(",");

    const priceRes = await axios.get(`${BASE_URL}/pricemultifull`, {
      params: { fsyms: symbolsWithUsdt, tsyms: "INR,USD" },
      timeout: 10000,
    });

    let USD_INR_RATE = 88;
    if (
      priceRes.data.RAW &&
      priceRes.data.RAW.USDT &&
      priceRes.data.RAW.USDT.INR
    ) {
      USD_INR_RATE = priceRes.data.RAW.USDT.INR.PRICE;
    }

    const assets = symbols.map((symbol) => {
      const rawINR =
        priceRes.data.RAW &&
        priceRes.data.RAW[symbol] &&
        priceRes.data.RAW[symbol].INR;
      const rawUSD =
        priceRes.data.RAW &&
        priceRes.data.RAW[symbol] &&
        priceRes.data.RAW[symbol].USD;
      const display =
        priceRes.data.DISPLAY &&
        priceRes.data.DISPLAY[symbol] &&
        priceRes.data.DISPLAY[symbol].INR;

      let price = 0;
      let high24h = 0;
      let low24h = 0;
      let volume24h = 0;
      let changePct24h = 0;
      let image = "";

      if (rawINR) {
        price = rawINR.PRICE;
        high24h = rawINR.HIGH24HOUR || 0;
        low24h = rawINR.LOW24HOUR || 0;
        volume24h = rawINR.VOLUME24HOURTO || 0;
        changePct24h = rawINR.CHANGEPCT24HOUR || 0;
        image = `https://www.cryptocompare.com${display ? display.IMAGEURL : ""}`;
      } else if (rawUSD) {
        price = rawUSD.PRICE * USD_INR_RATE;
        high24h = (rawUSD.HIGH24HOUR || 0) * USD_INR_RATE;
        low24h = (rawUSD.LOW24HOUR || 0) * USD_INR_RATE;
        volume24h = (rawUSD.VOLUME24HOURTO || 0) * USD_INR_RATE;
        changePct24h = rawUSD.CHANGEPCT24HOUR || 0;
        const displayUSD =
          priceRes.data.DISPLAY &&
          priceRes.data.DISPLAY[symbol] &&
          priceRes.data.DISPLAY[symbol].USD;
        image = `https://www.cryptocompare.com${displayUSD ? displayUSD.IMAGEURL : ""}`;
      }

      return {
        symbol: symbol,
        fullName: symbol,
        price,
        high24h,
        low24h,
        volume24h,
        changePct24h,
        image:
          image && image !== "https://www.cryptocompare.com" ? image : null,
      };
    });

    return {
      assets,
      total: assets.length,
      page: 1,
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error(
      "Error fetching curated recently listed crypto:",
      error.message,
    );
    throw error;
  }
};

module.exports = {
  fetchMarketData,
  getAssetDetails,
  fetchHistoricalData,
  fetchRecentlyListed,
};
