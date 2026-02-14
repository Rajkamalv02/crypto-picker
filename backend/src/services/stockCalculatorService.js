const logger = require('../utils/logger');

/**
 * Calculates trading charges for Indian Stock Market (Equity Delivery)
 * @param {number} amount - Investment amount in INR
 * @param {string} type - 'buy' or 'sell'
 * @returns {object} - Breakdown of charges
 */
const calculateStockCharges = (amount, type = 'buy') => {
    try {
        logger.info(`Calculating Indian Stock ${type} charges for amount: ${amount} INR`);

        // Typical Equity Delivery Charges (e.g., Zerodha)
        const brokerage = 0; // 0 for equity delivery
        const sttRate = 0.001; // 0.1%
        const txnChargeRate = 0.000345; // 0.0345% (NSE)
        const sebiRate = 0.000001; // 0.0001%
        const stampDutyRate = type === 'buy' ? 0.015 / 100 : 0; // 0.015% only on buy
        const gstRate = 0.18; // 18% on (Brokerage + Txn Charges)

        const stt = amount * sttRate;
        const txnCharge = amount * txnChargeRate;
        const sebi = amount * sebiRate;
        const stampDuty = amount * stampDutyRate;
        const gst = (brokerage + txnCharge) * gstRate;

        const totalCharges = stt + txnCharge + sebi + stampDuty + gst;
        const netAmount = type === 'buy' ? (amount - totalCharges) : (amount - totalCharges);

        return {
            investmentAmount: amount,
            type,
            brokerage,
            stt,
            txnCharge,
            sebi,
            stampDuty,
            gst,
            totalCharges,
            netAmount,
            details: {
                brokerage: "0 (Delivery)",
                stt: "0.1%",
                txnCharge: "0.0345%",
                gst: "18% on Txn Charges",
                stampDuty: type === 'buy' ? "0.015%" : "0%"
            }
        };
    } catch (error) {
        logger.error('Error in calculateStockCharges:', error.message);
        throw error;
    }
};

module.exports = {
    calculateStockCharges
};
