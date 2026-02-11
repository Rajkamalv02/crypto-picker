const logger = require('../utils/logger');

/**
 * Calculates trading charges for Coinswitch (India)
 * @param {number} amount - Investment amount in INR
 * @param {string} type - 'buy' or 'sell'
 * @returns {object} - Breakdown of charges
 */
const calculateCharges = (amount, type = 'buy') => {
    try {
        logger.info(`Calculating ${type} charges for amount: ${amount} INR`);

        const brokerageRate = 0.005; // 0.5%
        const gstRate = 0.18; // 18% on brokerage
        const tdsRate = 0.01; // 1% on sell side

        const brokerage = amount * brokerageRate;
        const gst = brokerage * gstRate;
        
        let tds = 0;
        if (type === 'sell') {
            // TDS applies to the total sell value
            tds = amount * tdsRate;
        }

        const totalCharges = brokerage + gst + tds;
        const netAmount = type === 'buy' ? (amount - totalCharges) : (amount - totalCharges);

        return {
            investmentAmount: amount,
            type,
            brokerage,
            gst,
            tds,
            totalCharges,
            netAmount,
            details: {
                brokerageRate: "0.5%",
                gstRate: "18% on brokerage",
                tdsRate: type === 'sell' ? "1%" : "0%"
            }
        };
    } catch (error) {
        logger.error('Error in calculateCharges:', error.message);
        throw error;
    }
};

module.exports = {
    calculateCharges
};
