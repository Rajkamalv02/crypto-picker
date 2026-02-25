"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SwingAnalysisProps {
  data: {
    trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
    lastSwingHigh?: number;
    lastSwingLow?: number;
    resistance?: number;
    support?: number;
    avgVolatility?: number;
    timeSinceLastSwing?: number;
  };
}

export default function SwingAnalysis({ data }: SwingAnalysisProps) {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "BULLISH":
        return "text-green-400";
      case "BEARISH":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "BULLISH":
        return <TrendingUp className="text-green-400" size={24} />;
      case "BEARISH":
        return <TrendingDown className="text-red-400" size={24} />;
      default:
        return <Minus className="text-gray-400" size={24} />;
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case "BULLISH":
        return "bg-green-900/20 border-green-700";
      case "BEARISH":
        return "bg-red-900/20 border-red-700";
      default:
        return "bg-gray-900/20 border-gray-700";
    }
  };

  return (
    <div className="swing-analysis bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Swing Trading Analysis</h3>

      {/* Trend Indicator */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border mb-4 ${getTrendBg(data.trend)}`}>
        {getTrendIcon(data.trend)}
        <div>
          <div className="text-sm text-gray-400">Current Trend</div>
          <div className={`text-xl font-bold ${getTrendColor(data.trend)}`}>
            {data.trend}
          </div>
        </div>
      </div>

      {/* Swing Points */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Last Swing High</div>
          <div className="text-lg font-semibold text-red-400">
            {data.lastSwingHigh ? `₹${data.lastSwingHigh.toFixed(2)}` : "N/A"}
          </div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Last Swing Low</div>
          <div className="text-lg font-semibold text-green-400">
            {data.lastSwingLow ? `₹${data.lastSwingLow.toFixed(2)}` : "N/A"}
          </div>
        </div>
      </div>

      {/* Support/Resistance */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Resistance Level</div>
          <div className="text-lg font-semibold text-orange-400">
            {data.resistance ? `₹${data.resistance.toFixed(2)}` : "N/A"}
          </div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Support Level</div>
          <div className="text-lg font-semibold text-blue-400">
            {data.support ? `₹${data.support.toFixed(2)}` : "N/A"}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Avg Swing Volatility</div>
          <div className="text-lg font-semibold text-purple-400">
            {data.avgVolatility ? `${data.avgVolatility.toFixed(2)}%` : "N/A"}
          </div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Time Since Last Swing</div>
          <div className="text-lg font-semibold text-cyan-400">
            {data.timeSinceLastSwing ? `${data.timeSinceLastSwing} bars` : "N/A"}
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <div className="text-sm text-blue-300">
          <strong>Interpretation:</strong>{" "}
          {data.trend === "BULLISH" && "The market is in an uptrend with higher highs and higher lows. Look for pullbacks to support for buying opportunities."}
          {data.trend === "BEARISH" && "The market is in a downtrend with lower highs and lower lows. Look for rallies to resistance for selling opportunities."}
          {data.trend === "SIDEWAYS" && "The market is consolidating. Wait for a breakout above resistance or breakdown below support."}
        </div>
      </div>
    </div>
  );
}
