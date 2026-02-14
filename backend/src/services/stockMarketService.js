const axios = require('axios');
const logger = require('../utils/logger');

// List of some prominent Nifty 50 stocks
const NIFTY_50_SYMBOLS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 
    'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS',
    'AXISBANK.NS', 'HINDUNILVR.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
    'TITAN.NS', 'BAJFINANCE.NS', 'ULTRACEMCO.NS', 'WIPRO.NS', 'M&M.NS',
    'NTPC.NS', 'HCLTECH.NS', 'JSWSTEEL.NS', 'TATASTEEL.NS', 'POWERGRID.NS',
    'ADANIENT.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'GRASIM.NS', 'BAJAJ-AUTO.NS'
];

// Fallback image for stocks
const DEFAULT_STOCK_IMAGE = 'https://s3-symbol-logo.tradingview.com/indices/nifty-50.svg';

const fetchMarketData = async (options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      minPrice, 
      maxPrice, 
      search = '' 
    } = options;

    const trimmedSearch = search.trim().toLowerCase();
    
    // Yahoo Finance Query for multiple symbols
    // Using query2.finance.yahoo.com for better reliability
    const symbols = NIFTY_50_SYMBOLS.join(',');
    const response = await axios.get(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, {
        timeout: 10000
    });

    if (!response.data || !response.data.quoteResponse || !response.data.quoteResponse.result) {
        throw new Error('Failed to fetch market data from Yahoo Finance');
    }

    const rawData = response.data.quoteResponse.result;

    // Filter and transform data
    let filteredData = rawData
      .map(stock => {
        return {
          symbol: stock.symbol,
          fullName: stock.longName || stock.shortName,
          price: stock.regularMarketPrice,
          high24h: stock.regularMarketDayHigh,
          low24h: stock.regularMarketDayLow,
          volume24h: stock.regularMarketVolume,
          changePct24h: stock.regularMarketChangePercent,
          image: DEFAULT_STOCK_IMAGE // Yahoo doesn't provide easy logo URLs
        };
      })
      .filter(stock => {
        // Price filtering only if provided
        const matchesMinPrice = minPrice !== undefined ? stock.price >= minPrice : true;
        const matchesMaxPrice = maxPrice !== undefined ? stock.price <= maxPrice : true;
        
        const matchesSearch = !trimmedSearch || 
          stock.symbol.toLowerCase().includes(trimmedSearch) || 
          stock.fullName.toLowerCase().includes(trimmedSearch);
          
        return matchesMinPrice && matchesMaxPrice && matchesSearch;
      })
      .sort((a, b) => b.volume24h - a.volume24h);

    const totalCount = filteredData.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + parseInt(limit));

    logger.info(`Successfully filtered ${totalCount} stocks, returning page ${page}`);
    
    return {
      assets: paginatedData,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    logger.error('Error fetching stock market data:', error.message);
    throw error;
  }
};

const getAssetDetails = async (symbol) => {
    try {
        logger.info(`Fetching details for stock: ${symbol}`);
        const response = await axios.get(`https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);

        if (!response.data || !response.data.quoteResponse || !response.data.quoteResponse.result || response.data.quoteResponse.result.length === 0) {
            throw new Error(`Stock ${symbol} not found`);
        }

        const stock = response.data.quoteResponse.result[0];
        
        return {
            symbol: stock.symbol,
            fullName: stock.longName || stock.shortName,
            price: stock.regularMarketPrice,
            high24h: stock.regularMarketDayHigh,
            low24h: stock.regularMarketDayLow,
            volume24h: stock.regularMarketVolume,
            changePct24h: stock.regularMarketChangePercent,
            image: DEFAULT_STOCK_IMAGE
        };
    } catch (error) {
        logger.error(`Error fetching stock details for ${symbol}:`, error.message);
        throw error;
    }
}

const fetchHistoricalData = async (symbol, range = '1mo', interval = '1h') => {
    try {
        logger.info(`Fetching historical data for ${symbol}, range: ${range}, interval: ${interval}`);
        // Yahoo Finance v8 chart endpoint
        const response = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
            params: {
                range: range,
                interval: interval
            }
        });

        if (!response.data || !response.data.chart || !response.data.chart.result) {
            throw new Error('Failed to fetch historical data from Yahoo Finance');
        }

        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        // Transform to match existing format: {time, close, high, low, open, volumefrom, volumeto}
        return timestamps.map((time, i) => ({
            time: time,
            close: quotes.close[i],
            high: quotes.high[i],
            low: quotes.low[i],
            open: quotes.open[i],
            volume: quotes.volume[i]
        })).filter(d => d.close !== null); // Filter out any null entries
    } catch (error) {
        logger.error(`Error fetching historical data for ${symbol}:`, error.message);
        throw error;
    }
};

module.exports = {
  fetchMarketData,
  getAssetDetails,
  fetchHistoricalData
};
