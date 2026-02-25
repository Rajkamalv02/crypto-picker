const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

// Simple Technical Analysis Math Library
const indicators = {
  rsi: (prices, length = 14) => {
    if (prices.length < length + 1) return []; // Require enough data
    let gains = 0;
    let losses = 0;

    // First average
    for (let i = 1; i <= length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / length;
    let avgLoss = losses / length;

    const rsiValues = [];
    // First RSI value
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs));

    // Subsequent values
    for (let i = length + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      let currentGain = diff >= 0 ? diff : 0;
      let currentLoss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (length - 1) + currentGain) / length;
      avgLoss = (avgLoss * (length - 1) + currentLoss) / length;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
    return rsiValues;
  },

  sma: (prices, length) => {
    if (prices.length < length) return [];
    const smas = [];
    for (let i = length - 1; i < prices.length; i++) {
      const slice = prices.slice(i - length + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      smas.push(sum / length);
    }
    return smas;
  },

  ema: (prices, length) => {
    if (prices.length < length) return [];
    const emas = [];
    const k = 2 / (length + 1);

    // Use SMA for the first EMA value
    let currentEma =
      prices.slice(0, length).reduce((a, b) => a + b, 0) / length;
    emas.push(currentEma);

    for (let i = length; i < prices.length; i++) {
      currentEma = (prices[i] - currentEma) * k + currentEma;
      emas.push(currentEma);
    }
    return emas;
  },

  mad: (prices, length) => {
    if (prices.length < length) return [];
    const mads = [];
    for (let i = length - 1; i < prices.length; i++) {
      const slice = prices.slice(i - length + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / length;
      const absoluteDeviations = slice.map((p) => Math.abs(p - mean));
      const mad = absoluteDeviations.reduce((a, b) => a + b, 0) / length;
      mads.push(mad);
    }
    return mads;
  },
};

const listStrategies = async () => {
  const pineDir = path.join(__dirname, "../../pine-code");
  const files = fs.readdirSync(pineDir);
  return files
    .filter((f) => f.endsWith(".pine"))
    .map((f) => {
      const name = f.replace(".pine", "");
      return {
        id: name,
        name: name
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        description,
      };
    });
};

const executeStrategy = async (
  symbol,
  history,
  strategyName = "impluse_strategy",
) => {
  try {
    logger.info(`Executing strategy '${strategyName}' for ${symbol}`);

    const pinePath = path.join(
      __dirname,
      `../../pine-code/${strategyName}.pine`,
    );

    if (!fs.existsSync(pinePath)) {
      throw new Error(`Strategy file ${strategyName}.pine not found`);
    }

    const pineCode = fs.readFileSync(pinePath, "utf8");
    const closePrices = history.map((h) => h.close);

    if (strategyName === "impluse_strategy") {
      // Implementation of Impulse Trend Levels [BOSWaves]
      // From script: https://in.tradingview.com/script/cmA33Ppg-Impulse-Trend-Levels-BOSWaves/
      const len = 19;
      const impulseLen = 5;
      const madLen = 20;

      const basis = indicators.ema(closePrices, len);
      const mad = indicators.mad(closePrices, madLen);

      if (basis.length < 2 || mad.length < 2) {
        return {
          signal: "NEUTRAL",
          probability: 0,
          reason: "Insufficient data for Impulse Strategy",
        };
      }

      const latestBasis = basis[basis.length - 1];
      const latestMad = mad[mad.length - 1];
      const currentClose = closePrices[closePrices.length - 1];
      const prevClose = closePrices[closePrices.length - 2];
      const impulseRefClose = closePrices[closePrices.length - 1 - impulseLen];

      const rawImpulse =
        latestMad > 0 ? (currentClose - impulseRefClose) / latestMad : 0;
      const absRaw = Math.abs(rawImpulse);

      const freshness = Math.min(absRaw / 2.0, 1.0);
      const bandMult = 1.9 - (1.9 - 1.5) * freshness;

      const upper = latestBasis + latestMad * bandMult;
      const lower = latestBasis - latestMad * bandMult;

      let signal = "NEUTRAL";
      let reason = `Impulse: ${rawImpulse.toFixed(2)}, Basis: ${latestBasis.toFixed(2)}`;

      if (currentClose > upper) {
        signal = "BUY";
        reason = `Impulse Bullish: Price crossed above adaptive upper band (${upper.toFixed(2)})`;
      } else if (currentClose < lower) {
        signal = "SELL";
        reason = `Impulse Bearish: Price crossed below adaptive lower band (${lower.toFixed(2)})`;
      }

      return {
        signal,
        probability: 0.65,
        reason,
        latestValue: rawImpulse.toFixed(2),
      };
    }

    return { signal: "NEUTRAL", probability: 0, reason: "Unknown Strategy" };
  } catch (error) {
    logger.error("Error in strategy execution:", error.message);
    throw error;
  }
};

const calculateProbability = (prices, indicatorValues, signal, type) => {
  if (signal === "NEUTRAL") return 0.5;

  let successes = 0;
  let occurrences = 0;
  const lookAhead = 5;

  // Logic for backtesting probability based on signal type
  // Note: This is a simplified backtest simulation

  if (type === "rsi") {
    const rsiValues = indicatorValues;
    // rsiValues index 0 corresponds to prices index rsiLength
    // We need to align them.
    // But for simplicity, let's just iterate backwards a bit safely
    // Assuming rsiValues aligned such that rsiValues[i] is calculation at prices[prices.length - rsiValues.length + i]

    const offset = prices.length - rsiValues.length;

    for (let i = 0; i < rsiValues.length - lookAhead; i++) {
      const rsi = rsiValues[i];
      const priceAtSignal = prices[i + offset];
      const futurePrice = prices[i + offset + lookAhead];

      if (signal === "BUY" && rsi < 30) {
        occurrences++;
        if (futurePrice > priceAtSignal) successes++;
      } else if (signal === "SELL" && rsi > 70) {
        occurrences++;
        if (futurePrice < priceAtSignal) successes++;
      }
    }
  } else if (type === "sma") {
    const { short, long } = indicatorValues;
    // Align arrays. Both end at same time. Start at different times.
    // We use the common length at the end.
    const minLen = Math.min(short.length, long.length);

    const shortOffset = short.length - minLen;
    const longOffset = long.length - minLen;
    const priceOffset = prices.length - minLen;

    for (let i = 1; i < minLen - lookAhead; i++) {
      const sPrev = short[shortOffset + i - 1];
      const lPrev = long[longOffset + i - 1];
      const sCurr = short[shortOffset + i];
      const lCurr = long[longOffset + i];

      const priceAtSignal = prices[priceOffset + i];
      const futurePrice = prices[priceOffset + i + lookAhead];

      // Check cross
      if (signal === "BUY" && sPrev <= lPrev && sCurr > lCurr) {
        occurrences++;
        if (futurePrice > priceAtSignal) successes++;
      } else if (signal === "SELL" && sPrev >= lPrev && sCurr < lCurr) {
        occurrences++;
        if (futurePrice < priceAtSignal) successes++;
      }
    }
  }

  if (occurrences === 0) return 0.5;
  return successes / occurrences;
};

// Pine Script Parser Integration
const { parsePineScript } = require("./pineScriptParser");
const { PineCodeValidator } = require("../utils/pineCodeValidator");

/**
 * Execute a Pine Script strategy dynamically
 */
const executePineStrategy = async (symbol, history, pineCode) => {
  try {
    logger.info(`Executing Pine Script strategy for ${symbol}`);

    // Validate Pine Script code
    const validator = new PineCodeValidator();
    const validation = validator.validate(pineCode);

    if (!validation.valid) {
      logger.error("Pine Script validation failed:", validation.errors);
      return {
        signal: "NEUTRAL",
        probability: 0,
        reason: `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
        errors: validation.errors,
      };
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      logger.warn("Pine Script warnings:", validation.warnings);
    }

    // Sanitize code
    const sanitizedCode = PineCodeValidator.sanitize(pineCode);

    // Parse and execute with timeout
    const parseResult = await PineCodeValidator.validateExecution(() => {
      return parsePineScript(sanitizedCode, history);
    });

    if (!parseResult.success) {
      logger.error("Pine Script execution failed:", parseResult.error);
      return {
        signal: "NEUTRAL",
        probability: 0,
        reason: `Execution failed: ${parseResult.error}`,
      };
    }

    // Extract signals from execution result
    const { variables } = parseResult.result;

    // Determine signal based on common Pine Script patterns
    let signal = "NEUTRAL";
    let reason = "Pine Script executed successfully";
    let probability = 0.5;

    // Check for common signal variables
    if (variables.buySignal === true || variables.longCondition === true) {
      signal = "BUY";
      reason = "Pine Script generated BUY signal";
      probability = 0.7;
    } else if (
      variables.sellSignal === true ||
      variables.shortCondition === true
    ) {
      signal = "SELL";
      reason = "Pine Script generated SELL signal";
      probability = 0.7;
    }

    // Check for RSI-based signals
    if (variables.rsi && Array.isArray(variables.rsi)) {
      const latestRsi = variables.rsi[variables.rsi.length - 1];
      if (latestRsi < 30) {
        signal = "BUY";
        reason = `RSI Oversold: ${latestRsi.toFixed(2)}`;
        probability = 0.65;
      } else if (latestRsi > 70) {
        signal = "SELL";
        reason = `RSI Overbought: ${latestRsi.toFixed(2)}`;
        probability = 0.65;
      }
    }

    // Check for crossover signals
    if (variables.crossover === true) {
      signal = "BUY";
      reason = "Bullish crossover detected";
      probability = 0.7;
    } else if (variables.crossunder === true) {
      signal = "SELL";
      reason = "Bearish crossunder detected";
      probability = 0.7;
    }

    return {
      signal,
      probability,
      reason,
      variables: Object.keys(variables).reduce((acc, key) => {
        const value = variables[key];
        if (Array.isArray(value)) {
          acc[key] = value[value.length - 1]; // Latest value
        } else {
          acc[key] = value;
        }
        return acc;
      }, {}),
      warnings: validation.warnings,
    };
  } catch (error) {
    logger.error("Error in Pine Script execution:", error.message);
    return {
      signal: "NEUTRAL",
      probability: 0,
      reason: `Error: ${error.message}`,
    };
  }
};

module.exports = {
  executeStrategy,
  listStrategies,
  executePineStrategy,
};
