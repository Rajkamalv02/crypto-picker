const express = require('express');
const router = express.Router();
const stockMarketService = require('../services/stockMarketService');
const stockCalculatorService = require('../services/stockCalculatorService');
const strategyService = require('../services/strategyService');
const logger = require('../utils/logger');

// Strategy List (Shared)
router.get('/strategies', async (req, res) => {
    try {
        const strategies = await strategyService.listStrategies();
        res.json(strategies);
    } catch (error) {
        logger.error('Error in /stock/strategies:', error.message);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Stock Market List
router.get('/market', async (req, res) => {
    try {
        const { page, limit, minPrice, maxPrice, search } = req.query;
        const data = await stockMarketService.fetchMarketData({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 5,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            search: search || ''
        });
        res.json(data);
    } catch (error) {
        logger.error('Error in /stock/market:', error.message);
        res.status(500).json({ error: 'Failed to fetch stock market data' });
    }
});

// Stock Asset Detail with Signal and Charges
router.get('/asset/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const amount = parseFloat(req.query.amount) || 1000;
        const strategyName = req.query.strategy || 'rsi_strategy';

        logger.info(`Processing stock request for: ${symbol} with amount: ${amount} and strategy: ${strategyName}`);

        // 1. Get Real-time Details
        const details = await stockMarketService.getAssetDetails(symbol);

        // 2. Get Historical Data & Execute Strategy
        const history = await stockMarketService.fetchHistoricalData(symbol);
        const strategyResult = await strategyService.executeStrategy(symbol, history, strategyName);

        // 3. Calculate Charges
        const buyCharges = stockCalculatorService.calculateStockCharges(amount, 'buy');
        const sellCharges = stockCalculatorService.calculateStockCharges(amount, 'sell');

        res.json({
            asset: details,
            strategy: strategyResult,
            calculator: {
                buy: buyCharges,
                sell: sellCharges
            }
        });
    } catch (error) {
        logger.error(`Error in /stock/asset/${req.params.symbol}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch stock asset info' });
    }
});

module.exports = router;
