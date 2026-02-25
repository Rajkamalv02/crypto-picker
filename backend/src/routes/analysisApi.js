const express = require("express");
const router = express.Router();
const analysisService = require("../services/analysisService");
const logger = require("../utils/logger");

// GET /api/analysis/strategies
// Returns list of all strategies + their editable parameter definitions
router.get("/strategies", (req, res) => {
  try {
    const strategies = analysisService.getStrategies();
    res.json(strategies);
  } catch (err) {
    logger.error("[Analysis] /strategies error:", err.message);
    res.status(500).json({ error: "Failed to load strategies" });
  }
});

// POST /api/analysis/scan
// Body: { market: 'crypto' | 'stock', strategyId: string, params: {}, filters: { minPrice, maxPrice } }
router.post("/scan", async (req, res) => {
  try {
    const { market, strategyId, params = {}, filters = {} } = req.body;

    if (!market || !["crypto", "stock"].includes(market)) {
      return res
        .status(400)
        .json({ error: 'market must be "crypto" or "stock"' });
    }
    if (!strategyId) {
      return res.status(400).json({ error: "strategyId is required" });
    }

    logger.info(
      `[Analysis] Scan request: market=${market} strategy=${strategyId} filters=${JSON.stringify(filters)}`,
    );
    const result = await analysisService.scanMarket(
      market,
      strategyId,
      params,
      filters,
    );
    res.json(result);
  } catch (err) {
    logger.error("[Analysis] /scan error:", err.message);
    res.status(500).json({ error: err.message || "Scan failed" });
  }
});

module.exports = router;
