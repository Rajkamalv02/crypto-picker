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
      let description = "";
      if (name === "rsi_strategy")
        description = "Uses RSI(14) to detect Overbought/Oversold conditions.";
      else if (name === "sma_strategy")
        description =
          "Uses SMA(9) and SMA(21) crossover to detect trend changes.";
      else if (name === "impluse_strategy")
        description =
          "Adaptive bands and impulse detection for trend following.";

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
  strategyName = "rsi_strategy",
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

    if (strategyName === "rsi_strategy") {
      // Parse basic parameters
      const rsiLengthMatch = pineCode.match(/rsiLength\s*=\s*(\d+)/);
      const rsiLength = rsiLengthMatch ? parseInt(rsiLengthMatch[1]) : 14;

      const rsiValues = indicators.rsi(closePrices, rsiLength);

      if (!rsiValues || rsiValues.length === 0) {
        return {
          signal: "NEUTRAL",
          probability: 0,
          reason: "Insufficient data for RSI",
        };
      }

      const latestRsi = rsiValues[rsiValues.length - 1];

      let signal = "NEUTRAL";
      let reason = `RSI at ${latestRsi.toFixed(2)}`;

      if (latestRsi < 30) {
        signal = "BUY";
        reason = `Oversold RSI: ${latestRsi.toFixed(2)}`;
      } else if (latestRsi > 70) {
        signal = "SELL";
        reason = `Overbought RSI: ${latestRsi.toFixed(2)}`;
      }

      const probability = calculateProbability(
        closePrices,
        rsiValues,
        signal,
        "rsi",
      );

      return {
        signal,
        probability,
        reason,
        latestValue: latestRsi.toFixed(2),
      };
    } else if (strategyName === "sma_strategy") {
      // Parse SMA parameters
      const shortPeriodMatch = pineCode.match(/shortPeriod\s*=\s*(\d+)/);
      const longPeriodMatch = pineCode.match(/longPeriod\s*=\s*(\d+)/);

      const shortPeriod = shortPeriodMatch ? parseInt(shortPeriodMatch[1]) : 9;
      const longPeriod = longPeriodMatch ? parseInt(longPeriodMatch[1]) : 21;

      const shortSma = indicators.sma(closePrices, shortPeriod);
      const longSma = indicators.sma(closePrices, longPeriod);

      if (!shortSma.length || !longSma.length) {
        return {
          signal: "NEUTRAL",
          probability: 0,
          reason: "Insufficient data for SMA",
        };
      }

      const currentShort = shortSma[shortSma.length - 1];
      const currentLong = longSma[longSma.length - 1];
      const prevShort = shortSma[shortSma.length - 2];
      const prevLong = longSma[longSma.length - 2];

      let signal = "NEUTRAL";
      let reason = `SMA(${shortPeriod}): ${currentShort.toFixed(2)}, SMA(${longPeriod}): ${currentLong.toFixed(2)}`;

      // Check for crossover
      if (prevShort <= prevLong && currentShort > currentLong) {
        signal = "BUY";
        reason = `Golden Cross: SMA(${shortPeriod}) crossed above SMA(${longPeriod})`;
      } else if (prevShort >= prevLong && currentShort < currentLong) {
        signal = "SELL";
        reason = `Death Cross: SMA(${shortPeriod}) crossed below SMA(${longPeriod})`;
      } else if (currentShort > currentLong) {
        // Trend continuation
        reason = `Bullish Trend: SMA(${shortPeriod}) > SMA(${longPeriod})`;
      } else {
        reason = `Bearish Trend: SMA(${shortPeriod}) < SMA(${longPeriod})`;
      }

      // Calculate probability based on crossover events history
      const probability = calculateProbability(
        closePrices,
        { short: shortSma, long: longSma },
        signal,
        "sma",
      );

      return {
        signal,
        probability,
        reason,
        latestValue: `${currentShort.toFixed(2)} / ${currentLong.toFixed(2)}`,
      };
    } else if (strategyName === "impluse_strategy") {
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
    } // else if (strategyName === 'zscore_strategy') {
    //     // Z-Score Predictive Zones [AlgoPoint] Logic
    //     // From script: https://in.tradingview.com/script/KSMvIkvh-Z-Score-Predictive-Zones-AlgoPoint/
    //     const length = 144;
    //     const smooth = 20;

    //     if (closePrices.length < length + smooth) {
    //         return { signal: 'NEUTRAL', probability: 0, reason: 'Insufficient data for Z-Score' };
    //     }

    //     // 1. Raw Z-Score
    //     const zScores = [];
    //     for (let i = length; i <= closePrices.length; i++) {
    //         const slice = closePrices.slice(i - length, i);
    //         const mean = slice.reduce((a, b) => a + b, 0) / length;
    //         const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / length;
    //         const stdDev = Math.sqrt(variance);
    //         const rawZ = (closePrices[i - 1] - mean) / stdDev;
    //         zScores.push(rawZ);
    //     }

    //     // 2. Smooth with VWMA (using SMA as approximation here for complexity)
    //     const smoothedZ = indicators.sma(zScores, smooth);
    //     const currentZ = smoothedZ[smoothedZ.length - 1];

    //     let signal = 'NEUTRAL';
    //     let reason = `Z-Score: ${currentZ.toFixed(2)}`;

    //     // Using standard thresholds from script
    //     if (currentZ < -1.5) {
    //         signal = 'BUY';
    //         reason = `Statistical Bottom: Z-Score (${currentZ.toFixed(2)}) in Support Zone`;
    //     } else if (currentZ > 1.5) {
    //         signal = 'SELL';
    //         reason = `Statistical Top: Z-Score (${currentZ.toFixed(2)}) in Resistance Zone`;
    //     }

    //     return {
    //         signal,
    //         probability: 0.75,
    //         reason,
    //         latestValue: currentZ.toFixed(2)
    //     };
    // }

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

module.exports = {
  executeStrategy,
  listStrategies,
};
