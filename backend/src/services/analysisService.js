const fs = require("fs");
const path = require("path");
const axios = require("axios");
const logger = require("../utils/logger");

// ─── EXCHANGE RATE HANDLING ───────────────────────────────────────────────────

let cachedUsdInrRate = 83.5; // Fallback
let lastRateFetchTime = 0;
const RATE_CACHE_TTL = 3600000; // 1 hour

async function getUsdInrRate() {
  const now = Date.now();
  if (now - lastRateFetchTime < RATE_CACHE_TTL) return cachedUsdInrRate;

  try {
    const url =
      "https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=INR";
    const res = await axios.get(url, { timeout: 5000 });
    if (res.data?.INR) {
      cachedUsdInrRate = res.data.INR;
      lastRateFetchTime = now;
      logger.info(
        `[Analysis] Updated USD-INR Exchange Rate: ${cachedUsdInrRate}`,
      );
    }
  } catch (err) {
    logger.error(`[Analysis] Failed to fetch exchange rate: ${err.message}`);
  }
  return cachedUsdInrRate;
}

// ─── SYMBOL LISTS ─────────────────────────────────────────────────────────────

const NSE_STOCKS = [
  { name: "Reliance", symbol: "RELIANCE.NS" },
  { name: "TCS", symbol: "TCS.NS" },
  { name: "Infosys", symbol: "INFY.NS" },
  { name: "HDFC Bank", symbol: "HDFCBANK.NS" },
  { name: "ICICI Bank", symbol: "ICICIBANK.NS" },
  { name: "SBI", symbol: "SBIN.NS" },
  { name: "Tata Steel", symbol: "TATASTEEL.NS" },
  { name: "Tata Motors", symbol: "TATAMOTORS.NS" },
  { name: "Wipro", symbol: "WIPRO.NS" },
  { name: "HCL Tech", symbol: "HCLTECH.NS" },
  { name: "Axis Bank", symbol: "AXISBANK.NS" },
  { name: "Maruti", symbol: "MARUTI.NS" },
  { name: "L&T", symbol: "LT.NS" },
  { name: "Sun Pharma", symbol: "SUNPHARMA.NS" },
  { name: "Asian Paints", "symbol": "ASIANPAINT.NS" },
  { name: "Bajaj Finance", symbol: "BAJFINANCE.NS" },
  { name: "Adani Ports", symbol: "ADANIPORTS.NS" },
  { name: "Coal India", symbol: "COALINDIA.NS" },
  { name: "Power Grid", symbol: "POWERGRID.NS" },
  { name: "NTPC", symbol: "NTPC.NS" },
  { name: "JSW Steel", symbol: "JSWSTEEL.NS" },
  { name: "Hindalco", symbol: "HINDALCO.NS" },
  { name: "UltraTech", symbol: "ULTRACEMCO.NS" },
  { name: "Tech Mahindra", symbol: "TECHM.NS" },
  { name: "BHEL", symbol: "BHEL.NS" },
];

const CRYPTO_PAIRS = [
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "BNB", symbol: "BNB" },
  { name: "Solana", symbol: "SOL" },
  { name: "XRP", symbol: "XRP" },
  { name: "Dogecoin", symbol: "DOGE" },
  { name: "Cardano", symbol: "ADA" },
  { name: "Avalanche", symbol: "AVAX" },
  { name: "Chainlink", symbol: "LINK" },
  { name: "Polkadot", symbol: "DOT" },
  { name: "Litecoin", symbol: "LTC" },
  { name: "Uniswap", symbol: "UNI" },
  { name: "Stellar", symbol: "XLM" },
  { name: "Tron", symbol: "TRX" },
  { name: "Pepe", symbol: "PEPE" },
];

// ─── INDICATOR MATH (shared across strategies) ────────────────────────────────

function calcEma(values, len) {
  if (!values || values.length === 0) return [];
  const k = 2 / (len + 1);
  let ema = values[0];
  const out = [ema];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

function calcSma(values, len) {
  return values.map((_, i) => {
    if (i < len - 1) return null;
    const slice = values.slice(i - len + 1, i + 1).filter((v) => v != null);
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function calcAtr(candles, len) {
  const trs = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose),
    );
  });
  return calcEma(trs, len);
}

function calcMad(closes, len) {
  const means = calcSma(closes, len);
  const absDevs = closes.map((c, i) =>
    means[i] == null ? 0 : Math.abs(c - means[i]),
  );
  return calcSma(absDevs, len);
}

function calcRsi(closes, len) {
  if (closes.length < len + 1) return [];
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= len; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgGain = gains / len,
    avgLoss = losses / len;
  const out = [];
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push(100 - 100 / (1 + rs));
  for (let i = len + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (len - 1) + (d >= 0 ? d : 0)) / len;
    avgLoss = (avgLoss * (len - 1) + (d < 0 ? -d : 0)) / len;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

function calcAdx(candles, len) {
  const plusDM = [],
    minusDM = [],
    trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i],
      p = candles[i - 1];
    const upMove = c.high - p.high,
      downMove = p.low - c.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    trs.push(
      Math.max(
        c.high - c.low,
        Math.abs(c.high - p.close),
        Math.abs(c.low - p.close),
      ),
    );
  }
  const smoothTR = calcEma(trs, len);
  const smoothPlus = calcEma(plusDM, len);
  const smoothMinus = calcEma(minusDM, len);
  const diPlus = smoothPlus.map((v, i) =>
    smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0,
  );
  const diMinus = smoothMinus.map((v, i) =>
    smoothTR[i] > 0 ? (v / smoothTR[i]) * 100 : 0,
  );
  const dx = diPlus.map((v, i) => {
    const sum = v + diMinus[i];
    return sum > 0 ? (Math.abs(v - diMinus[i]) / sum) * 100 : 0;
  });
  return calcEma(dx, len);
}

// ─── DATA FETCHERS ────────────────────────────────────────────────────────────

async function fetchStockCandles(symbol) {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 90 * 24 * 60 * 60; // 90 days
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false`;
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000,
  });
  const result = res.data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  return timestamps
    .map((t, i) => ({
      time: t * 1000,
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume[i] || 0,
    }))
    .filter((c) => c.close != null && c.high != null && c.low != null);
}

async function fetchCryptoCandles(symbol) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=4h&limit=80`;
  const res = await axios.get(url, { timeout: 10000 });
  return res.data.map((k) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// ─── STRATEGY DEFINITIONS ─────────────────────────────────────────────────────
// Each strategy:
//   - id        → matches the .pine filename (without extension)
//   - name      → display name
//   - description
//   - params    → default parameters (overridable from UI), aligned with pine input.*
//   - analyse(candles, params) → { signal, score, maxScore, confidence, reason, details }

const STRATEGIES = {
  // ─── IMPULSE STRATEGY (mirrors BOSWaves scanner.js logic exactly) ──────────
  impluse_strategy: {
    id: "impluse_strategy",
    name: "Impulse Trend (BOSWaves)",
    description:
      "Adaptive EMA bands with impulse & momentum detection. Based on BOSWaves Swing Long strategy. Identifies breakout setups and pullback re-entries with ADX, volume, and HTF-EMA filters.",
    params: [
      {
        key: "emaLen",
        label: "Trend EMA Length",
        type: "int",
        default: 19,
        min: 5,
        max: 50,
      },
      {
        key: "impulseLen",
        label: "Impulse Lookback",
        type: "int",
        default: 5,
        min: 1,
        max: 20,
      },
      {
        key: "madLen",
        label: "MAD Length",
        type: "int",
        default: 20,
        min: 5,
        max: 50,
      },
      {
        key: "bandMin",
        label: "Band Min (Fresh)",
        type: "float",
        default: 1.5,
        min: 0.5,
        max: 3.0,
      },
      {
        key: "bandMax",
        label: "Band Max (Stale)",
        type: "float",
        default: 1.9,
        min: 1.0,
        max: 4.0,
      },
      {
        key: "adxLen",
        label: "ADX Length",
        type: "int",
        default: 14,
        min: 5,
        max: 30,
      },
      {
        key: "adxThresh",
        label: "ADX Threshold",
        type: "float",
        default: 20.0,
        min: 10,
        max: 50,
      },
      {
        key: "volLen",
        label: "Volume Avg Length",
        type: "int",
        default: 20,
        min: 5,
        max: 50,
      },
      {
        key: "volMult",
        label: "Volume Multiplier",
        type: "float",
        default: 1.2,
        min: 1.0,
        max: 3.0,
      },
      {
        key: "htfEmaLen",
        label: "HTF EMA Length",
        type: "int",
        default: 50,
        min: 10,
        max: 200,
      },
    ],
    analyse(candles, params) {
      if (candles.length < 30) return null;
      const p = params;
      const closes = candles.map((c) => c.close);
      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const volumes = candles.map((c) => c.volume);

      const ema = calcEma(closes, p.emaLen);
      const atr14 = calcAtr(candles, 14);
      const madArr = calcMad(closes, p.madLen);
      const adxArr = calcAdx(candles, p.adxLen);
      const volSma = calcSma(volumes, p.volLen);
      const htfEmaArr = calcEma(closes, p.htfEmaLen);

      const n = closes.length - 1;
      const basis = ema[n];
      const atrNow = atr14[n];
      const madNow = Math.max(madArr[n] ?? 0, atrNow * 0.1);
      const adxNow = adxArr[n - 1] ?? 0;
      const volNow = volumes[n];
      const volAvg = volSma[n] ?? 1;
      const closeNow = closes[n];
      const htfEma = htfEmaArr[n];

      const rawImpulse =
        madNow > 0
          ? (closeNow - closes[Math.max(0, n - p.impulseLen)]) / madNow
          : 0;
      const impulseStr = Math.abs(rawImpulse);
      const freshness = Math.min(impulseStr / 2.0, 1.0);
      const bandMult = p.bandMax - (p.bandMax - p.bandMin) * freshness;
      const upper = basis + madNow * bandMult;
      const lower = basis - madNow * bandMult;
      const atrPrev5 = atr14[Math.max(0, n - 5)] ?? atrNow;
      const atrExpanding = atrNow > atrPrev5;

      const conds = {
        aboveBasis: closeNow > basis,
        aboveHtfEma: closeNow > htfEma,
        impulseActive: impulseStr > 1.0 && rawImpulse > 0,
        volumeStrong: volNow >= volAvg * p.volMult,
        adxStrong: adxNow >= p.adxThresh,
        atrExpanding: atrExpanding,
        nearBreakout: closeNow >= basis && closeNow <= upper * 1.02,
        pullbackSetup:
          closeNow > basis &&
          closeNow < upper &&
          impulseStr > 1.2 &&
          rawImpulse > 0,
      };

      const score = Object.values(conds).filter(Boolean).length;
      const maxScore = 8;
      const conf = Math.round((score / maxScore) * 100);

      let signal = "Avoid";
      if (score >= 6 && conds.aboveBasis && conds.impulseActive)
        signal = "Strong Buy Setup";
      else if (score >= 5 && conds.aboveBasis) signal = "Potential Buy";
      else if (score >= 4 && conds.pullbackSetup) signal = "Pullback Setup";
      else if (score >= 3) signal = "Watch List";

      const reason = `Impulse: ${rawImpulse.toFixed(2)} | ADX: ${adxNow.toFixed(1)} | Vol×: ${(volNow / volAvg).toFixed(2)}`;

      return {
        signal,
        score,
        maxScore,
        confidence: conf,
        reason,
        details: {
          price: closeNow,
          basis: basis.toFixed(2),
          upper: upper.toFixed(2),
          lower: lower.toFixed(2),
          adxNow: adxNow.toFixed(1),
          volRatio: (volNow / volAvg).toFixed(2),
          impulseStrength: rawImpulse.toFixed(2),
          freshness: (freshness * 100).toFixed(0) + "%",
          conditions: conds,
        },
      };
    },
  },
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Returns list of all strategies with metadata and param definitions.
 */
function getStrategies() {
  return Object.values(STRATEGIES).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    params: s.params,
  }));
}

/**
 * Scans all symbols for the given market using the given strategy.
 * Returns top results sorted by score desc.
 */
async function scanMarket(
  market,
  strategyId,
  paramOverrides = {},
  filters = {},
) {
  const strategy = STRATEGIES[strategyId];
  if (!strategy) throw new Error(`Unknown strategy: ${strategyId}`);

  const minPrice =
    filters.minPrice !== undefined ? parseFloat(filters.minPrice) : null;
  const maxPrice =
    filters.maxPrice !== undefined ? parseFloat(filters.maxPrice) : null;

  // Fetch exchange rate once for the scan
  const usdInrRate = await getUsdInrRate();

  // Build effective params (defaults merged with overrides)
  const params = {};
  for (const p of strategy.params) {
    const raw = paramOverrides[p.key];
    params[p.key] =
      raw !== undefined
        ? p.type === "int"
          ? parseInt(raw)
          : parseFloat(raw)
        : p.default;
  }

  const instruments = market === "crypto" ? CRYPTO_PAIRS : NSE_STOCKS;
  logger.info(
    `[Analysis] Scanning ${instruments.length} ${market} symbols with strategy: ${strategyId} (Price Filter: ${minPrice}-${maxPrice}, Rate: ${usdInrRate})`,
  );

  // Fetch + analyse in parallel batches of 5 to avoid rate-limiting
  const results = [];
  const errors = [];
  const batchSize = 5;

  for (let i = 0; i < instruments.length; i += batchSize) {
    const batch = instruments.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map(async (inst) => {
        try {
          let candles =
            market === "crypto"
              ? await fetchCryptoCandles(inst.symbol)
              : await fetchStockCandles(inst.symbol);

          if (candles.length === 0) return null;

          // ─── CONVERT CRYPTO TO INR ───
          if (market === "crypto") {
            candles = candles.map((c) => ({
              ...c,
              open: c.open * usdInrRate,
              high: c.high * usdInrRate,
              low: c.low * usdInrRate,
              close: c.close * usdInrRate,
            }));
          }

          const latestClose = candles[candles.length - 1].close;
          if (market === "crypto" && inst.symbol === "TRX") {
            logger.info(
              `[Debug] TRX Price (Converted): ${latestClose} INR (Rate: ${usdInrRate})`,
            );
          }

          // ─── PRICE FILTERING & PENNY EXCLUSION ───
          // Default Penny Exclusion: Stocks < 10, Crypto < 0.00001 USD (~0.0008 INR)
          if (market === "stock" && latestClose < 10) return null;
          if (market === "crypto" && latestClose / usdInrRate < 0.00001)
            return null;

          const analysis = strategy.analyse(candles, params);
          if (!analysis) return null;

          const prevClose = candles[candles.length - 2]?.close ?? latestClose;
          const changePct =
            prevClose > 0 ? ((latestClose - prevClose) / prevClose) * 100 : 0;

          return {
            rank: 0,
            name: inst.name,
            symbol: inst.symbol,
            market: market === "crypto" ? "CRYPTO" : "NSE",
            price: latestClose,
            currency: "INR", // All results are now INR
            changePct: parseFloat(changePct.toFixed(2)),
            signal: analysis.signal,
            score: analysis.score,
            maxScore: analysis.maxScore,
            confidence: analysis.confidence,
            reason: analysis.reason,
            details: analysis.details,
            tvSymbol: inst.symbol,
          };
        } catch (err) {
          logger.error(`[Analysis] Failed ${inst.symbol}: ${err.message}`);
          errors.push({
            symbol: inst.symbol,
            name: inst.name,
            error: err.message,
          });
          return null;
        }
      }),
    );

    settled.forEach((r) => {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    });

    // Small delay between batches
    if (i + batchSize < instruments.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // Sort by score desc, then confidence desc
  results.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : b.confidence - a.confidence,
  );

  // Assign ranks
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  logger.info(
    `[Analysis] Scan complete: ${results.length} results, ${errors.length} errors`,
  );

  return {
    strategy: { id: strategy.id, name: strategy.name },
    market,
    results: results.slice(0, 20), // Top 20
    totalScanned: results.length + errors.length,
    errors,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getStrategies, scanMarket };
