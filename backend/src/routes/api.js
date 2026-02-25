const express = require("express");
const router = express.Router();
const marketService = require("../services/marketService");
const calculatorService = require("../services/calculatorService");
const strategyService = require("../services/strategyService");
const logger = require("../utils/logger");

// Strategy List
router.get("/strategies", async (req, res) => {
  try {
    const strategies = await strategyService.listStrategies();
    res.json(strategies);
  } catch (error) {
    logger.error("Error in /strategies:", error.message);
    res.status(500).json({ error: "Failed to fetch strategies" });
  }
});

// Market List
router.get("/market", async (req, res) => {
  try {
    const { page, limit, minPrice, maxPrice, search } = req.query;
    const data = await marketService.fetchMarketData({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 5,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search: search || "",
    });
    res.json(data);
  } catch (error) {
    logger.error("Error in /market:", error.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// Recently Listed
router.get("/recently-listed", async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await marketService.fetchRecentlyListed({
      limit: limit ? parseInt(limit) : 10,
    });
    res.json(data);
  } catch (error) {
    logger.error("Error in /recently-listed:", error.message);
    res.status(500).json({ error: "Failed to fetch recently listed data" });
  }
});

// Asset Detail with Signal and Charges
router.get("/asset/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const amount = parseFloat(req.query.amount) || 1000; // Default 1000 INR
    const strategyName = req.query.strategy || "rsi_strategy"; // Default strategy

    logger.info(
      `Processing request for asset: ${symbol} with amount: ${amount} and strategy: ${strategyName}`,
    );

    // 1. Get Real-time Details
    const details = await marketService.getAssetDetails(symbol);

    // 2. Get Historical Data & Execute Strategy
    const history = await marketService.fetchHistoricalData(symbol);
    const strategyResult = await strategyService.executeStrategy(
      symbol,
      history,
      strategyName,
    );

    // 3. Calculate Charges
    const buyCharges = calculatorService.calculateCharges(amount, "buy");
    const sellCharges = calculatorService.calculateCharges(amount, "sell");

    res.json({
      asset: details,
      strategy: strategyResult,
      calculator: {
        buy: buyCharges,
        sell: sellCharges,
      },
    });
  } catch (error) {
    logger.error(`Error in /asset/${req.params.symbol}:`, error.message);
    res.status(500).json({ error: "Failed to fetch asset info" });
  }
});

// Pine Script Management Endpoints

// Validate Pine Script code without saving
router.post("/strategies/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Pine Script code is required" });
    }

    const { PineCodeValidator } = require("../utils/pineCodeValidator");
    const validator = new PineCodeValidator();
    const validation = validator.validate(code);

    res.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    logger.error("Error in /strategies/validate:", error.message);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Upload/Create new Pine Script strategy
router.post("/strategies/upload", async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: "Name and code are required" });
    }

    // Validate code first
    const { PineCodeValidator } = require("../utils/pineCodeValidator");
    const validator = new PineCodeValidator();
    const validation = validator.validate(code);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid Pine Script code",
        errors: validation.errors,
      });
    }

    // Save to file system
    const fs = require("fs");
    const path = require("path");
    const pineDir = path.join(__dirname, "../../pine-code");
    const fileName = `${name}.pine`;
    const filePath = path.join(pineDir, fileName);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return res
        .status(409)
        .json({ error: "Strategy with this name already exists" });
    }

    // Add metadata comment
    const metadata = `// Custom Strategy: ${name}\n// Description: ${description || "No description"}\n// Created: ${new Date().toISOString()}\n\n`;
    fs.writeFileSync(filePath, metadata + code, "utf8");

    logger.info(`Created new Pine Script strategy: ${name}`);

    res.json({
      success: true,
      id: name,
      message: "Strategy created successfully",
      warnings: validation.warnings,
    });
  } catch (error) {
    logger.error("Error in /strategies/upload:", error.message);
    res.status(500).json({ error: "Failed to upload strategy" });
  }
});

// Get Pine Script code for a strategy
router.get("/strategies/:id/code", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = require("fs");
    const path = require("path");
    const pineDir = path.join(__dirname, "../../pine-code");
    const filePath = path.join(pineDir, `${id}.pine`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    const code = fs.readFileSync(filePath, "utf8");
    res.json({ id, code });
  } catch (error) {
    logger.error(`Error in /strategies/${req.params.id}/code:`, error.message);
    res.status(500).json({ error: "Failed to retrieve strategy code" });
  }
});

// Update existing Pine Script strategy
router.put("/strategies/:id/code", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    // Validate code
    const { PineCodeValidator } = require("../utils/pineCodeValidator");
    const validator = new PineCodeValidator();
    const validation = validator.validate(code);

    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid Pine Script code",
        errors: validation.errors,
      });
    }

    const fs = require("fs");
    const path = require("path");
    const pineDir = path.join(__dirname, "../../pine-code");
    const filePath = path.join(pineDir, `${id}.pine`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    // Update with metadata
    const metadata = `// Custom Strategy: ${id}\n// Description: ${description || "No description"}\n// Updated: ${new Date().toISOString()}\n\n`;
    fs.writeFileSync(filePath, metadata + code, "utf8");

    logger.info(`Updated Pine Script strategy: ${id}`);

    res.json({
      success: true,
      id,
      message: "Strategy updated successfully",
      warnings: validation.warnings,
    });
  } catch (error) {
    logger.error(`Error in /strategies/${req.params.id}/code:`, error.message);
    res.status(500).json({ error: "Failed to update strategy" });
  }
});

// Delete Pine Script strategy
router.delete("/strategies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = require("fs");
    const path = require("path");
    const pineDir = path.join(__dirname, "../../pine-code");
    const filePath = path.join(pineDir, `${id}.pine`);

    // Prevent deletion of built-in strategies
    const builtInStrategies = [
      "rsi_strategy",
      "sma_strategy",
      "impluse_strategy",
    ];
    if (builtInStrategies.includes(id)) {
      return res
        .status(403)
        .json({ error: "Cannot delete built-in strategies" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Strategy not found" });
    }

    fs.unlinkSync(filePath);
    logger.info(`Deleted Pine Script strategy: ${id}`);

    res.json({
      success: true,
      message: "Strategy deleted successfully",
    });
  } catch (error) {
    logger.error(`Error in /strategies/${req.params.id}:`, error.message);
    res.status(500).json({ error: "Failed to delete strategy" });
  }
});

// Execute custom Pine Script strategy
router.post("/strategies/execute", async (req, res) => {
  try {
    const { symbol, code } = req.body;

    if (!symbol || !code) {
      return res.status(400).json({ error: "Symbol and code are required" });
    }

    // Get historical data
    const history = await marketService.fetchHistoricalData(symbol);

    // Execute Pine Script
    const result = await strategyService.executePineStrategy(
      symbol,
      history,
      code,
    );

    res.json(result);
  } catch (error) {
    logger.error("Error in /strategies/execute:", error.message);
    res.status(500).json({ error: "Failed to execute strategy" });
  }
});

module.exports = router;
