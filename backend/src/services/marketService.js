const axios = require('axios');
const logger = require('../utils/logger');

// Using CryptoCompare as a reliable source for INR pairs and market data
const BASE_URL = 'https://min-api.cryptocompare.com/data';

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
    
    // Fetching top coins by 24h volume in INR - Fetching 2 pages to get top 200
    const fetchPages = [0, 1];
    let responses;
    try {
        responses = await Promise.all(
            fetchPages.map(p => axios.get(`${BASE_URL}/top/mktcapfull`, {
                params: { limit: 100, tsym: 'INR', page: p },
                timeout: 5000
            }))
        );
    } catch (axiosError) {
        throw axiosError;
    }

    let rawData = [];
    responses.forEach((res, index) => {
        if (res.data && (res.data.Response === 'Success' || res.data.Message === 'Success') && Array.isArray(res.data.Data)) {
            rawData = rawData.concat(res.data.Data);
        }
    });

    if (rawData.length === 0) {
      throw new Error('Failed to fetch market data from CryptoCompare');
    }

    // Filter and transform data
    let filteredData = rawData
      .map(coin => {
        if (!coin.RAW || !coin.RAW.INR) return null;
        
        return {
          symbol: coin.CoinInfo.Name,
          fullName: coin.CoinInfo.FullName,
          price: coin.RAW.INR.PRICE,
          high24h: coin.RAW.INR.HIGH24HOUR,
          low24h: coin.RAW.INR.LOW24HOUR,
          volume24h: coin.RAW.INR.VOLUME24HOURTO, // Traded volume in INR
          image: `https://www.cryptocompare.com${coin.CoinInfo.ImageUrl}`
        };
      })
      .filter(coin => {
        if (!coin) return false;
        
        // Price filtering only if provided
        const matchesMinPrice = minPrice !== undefined ? coin.price >= minPrice : true;
        const matchesMaxPrice = maxPrice !== undefined ? coin.price <= maxPrice : true;
        
        const matchesSearch = !trimmedSearch || 
          coin.symbol.toLowerCase().includes(trimmedSearch) || 
          coin.fullName.toLowerCase().includes(trimmedSearch);
          
        return matchesMinPrice && matchesMaxPrice && matchesSearch;
      })
      .sort((a, b) => b.volume24h - a.volume24h);

    const totalCount = filteredData.length;

    // Fallback for search if no results found in top market
    if (totalCount === 0 && trimmedSearch && trimmedSearch.length >= 2) {
        try {
            const upperSearch = trimmedSearch.toUpperCase();
            const fallbackRes = await axios.get(`${BASE_URL}/pricemultifull`, {
                params: { fsyms: upperSearch, tsyms: 'INR' },
                timeout: 3000
            });

            if (fallbackRes.data && fallbackRes.data.RAW && fallbackRes.data.RAW[upperSearch]) {
                const coin = fallbackRes.data.RAW[upperSearch].INR;
                const display = fallbackRes.data.DISPLAY[upperSearch].INR;
                
                const fallbackAsset = {
                    symbol: upperSearch,
                    fullName: upperSearch, // pricemultifull doesn't give FullName easily without extra calls
                    price: coin.PRICE,
                    high24h: coin.HIGH24HOUR,
                    low24h: coin.LOW24HOUR,
                    volume24h: coin.VOLUME24HOURTO,
                    image: `https://www.cryptocompare.com${display.IMAGEURL}`
                };

                return {
                    assets: [fallbackAsset],
                    total: 1,
                    page: 1,
                    limit: parseInt(limit)
                };
            }
        } catch (err) {
            logger.error(`Search fallback failed for ${trimmedSearch}:`, err.message);
        }
    }
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + parseInt(limit));

    logger.info(`Successfully filtered ${totalCount} assets, returning page ${page}`);
    
    return {
      assets: paginatedData,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    logger.error('Error fetching market data:', error.message);
    throw error;
  }
};

const getAssetDetails = async (symbol) => {
    try {
        logger.info(`Fetching details for asset: ${symbol}`);
        const response = await axios.get(`${BASE_URL}/pricemultifull`, {
            params: {
                fsyms: symbol,
                tsyms: 'INR'
            }
        });

        if (response.data.Response === 'Error') {
            throw new Error(response.data.Message);
        }

        const rawData = response.data.RAW[symbol].INR;
        const displayData = response.data.DISPLAY[symbol].INR;
        
        return {
            symbol: symbol,
            fullName: displayData.FROMSYMBOL, // Or we could use a better source for FullName if needed
            price: rawData.PRICE,
            high24h: rawData.HIGH24HOUR,
            low24h: rawData.LOW24HOUR,
            volume24h: rawData.VOLUME24HOURTO,
            changePct24h: rawData.CHANGEPCT24HOUR,
            image: `https://www.cryptocompare.com${displayData.IMAGEURL}`
        };
    } catch (error) {
        logger.error(`Error fetching asset details for ${symbol}:`, error.message);
        throw error;
    }
}

const fetchHistoricalData = async (symbol, limit = 100) => {
    try {
        logger.info(`Fetching historical data for ${symbol}, limit: ${limit}`);
        const response = await axios.get(`${BASE_URL}/v2/histohour`, {
            params: {
                fsym: symbol,
                tsym: 'INR',
                limit: limit
            }
        });

        if (response.data.Response === 'Error') {
            throw new Error(response.data.Message);
        }

        return response.data.Data.Data; // Array of {time, close, high, low, open, volumefrom, volumeto}
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
