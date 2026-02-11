"use client";
import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
  strategy?: string; // Kept for future use, currently unused
  theme?: "light" | "dark";
  autosize?: boolean;
  currency?: "INR" | "USD"; 
}

export default function TradingViewChart({
  symbol,
  strategy,
  theme = "dark",
  autosize = true,
  currency = "INR", // Default to INR based on requirements
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  useEffect(() => {
    if (!containerRef.current || !symbol) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Construct the symbol for the chart
    // If INR is selected, we multiply the crypto/USDT pair by the USD/INR pair
    // taking advantage of TradingView's symbol math.
    let chartSymbol = `BINANCE:${symbol}USDT`;
    if (currency === "INR") {
      chartSymbol = `BINANCE:${symbol}USDT*FX_IDC:USDINR`;
    }

    script.innerHTML = JSON.stringify({
      autosize: autosize,
      symbol: chartSymbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      withdateranges: true,
      hide_side_toolbar: false, // Enable drawing tools
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, theme, autosize, currency]);

  return (
    <>
      {/* Overlay background when expanded to dim the rest of the app */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div
        className={`transition-all duration-300 ease-in-out bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl ${
          isExpanded 
            ? "fixed inset-4 z-50 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] m-auto" 
            : "relative h-[500px] w-full"
        }`}
      >
        <div ref={containerRef} className="tradingview-widget-container h-full w-full">
          <div className="tradingview-widget-container__widget h-full w-full"></div>
        </div>

        {/* Expand/Collapse Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 p-2 bg-gray-800 text-gray-300 hover:text-white rounded-md shadow-lg border border-gray-600 hover:bg-gray-700 transition z-50 group"
          title={isExpanded ? "Minimize Chart" : "Maximize Chart"}
        >
          {isExpanded ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="4 14 10 14 10 20"></polyline>
              <polyline points="20 10 14 10 14 4"></polyline>
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
