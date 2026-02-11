const express = require('express');
const router = express.Router();
const marketService = require('../services/marketService');
const calculatorService = require('../services/calculatorService');
const strategyService = require('../services/strategyService');
const logger = require('../utils/logger');

// Strategy List
router.get('/strategies', async (req, res) => {
    try {
        const strategies = await strategyService.listStrategies();
        res.json(strategies);
    } catch (error) {
        logger.error('Error in /strategies:', error.message);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Market List
router.get('/market', async (req, res) => {
    try {
        const { page, limit, minPrice, maxPrice, search } = req.query;
        const data = await marketService.fetchMarketData({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 5,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            search: search || ''
        });
        res.json(data);
    } catch (error) {
        logger.error('Error in /market:', error.message);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

// Asset Detail with Signal and Charges
router.get('/asset/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const amount = parseFloat(req.query.amount) || 1000; // Default 1000 INR
        const strategyName = req.query.strategy || 'rsi_strategy'; // Default strategy

        logger.info(`Processing request for asset: ${symbol} with amount: ${amount} and strategy: ${strategyName}`);

        // 1. Get Real-time Details
        const details = await marketService.getAssetDetails(symbol);

        // 2. Get Historical Data & Execute Strategy
        const history = await marketService.fetchHistoricalData(symbol);
        const strategyResult = await strategyService.executeStrategy(symbol, history, strategyName);

        // 3. Calculate Charges
        const buyCharges = calculatorService.calculateCharges(amount, 'buy');
        const sellCharges = calculatorService.calculateCharges(amount, 'sell');

        res.json({
            asset: details,
            strategy: strategyResult,
            calculator: {
                buy: buyCharges,
                sell: sellCharges
            }
        });
    } catch (error) {
        logger.error(`Error in /asset/${req.params.symbol}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch asset info' });
    }
});

module.exports = router;
