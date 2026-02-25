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
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    
    console.log(`Initialising TradingView Chart for symbol: ${symbol}`);
    setError(null);

    const initWidget = () => {
        if (!containerRef.current) return;
        
        // Clear previous widget
        containerRef.current.innerHTML = "";
        const widgetContainer = document.createElement("div");
        widgetContainer.id = `tv_chart_${Math.random().toString(36).substring(7)}`;
        widgetContainer.className = "h-full w-full";
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        // Construct the symbol for the chart
        let chartSymbol = "";
        if (symbol.endsWith(".NS")) {
          // Indian Stock (e.g., RELIANCE.NS -> NSE:RELIANCE)
          const baseSymbol = symbol.replace(".NS", "");
          chartSymbol = `NSE:${baseSymbol}`;
          console.log(`Stock symbol detected: ${symbol} -> ${chartSymbol}`);
        } else {
          // Crypto
          chartSymbol = `BINANCE:${symbol}USDT`;
          if (currency === "INR") {
            chartSymbol = `BINANCE:${symbol}USDT*FX_IDC:USDINR`;
          }
          console.log(`Crypto symbol detected: ${symbol} -> ${chartSymbol}`);
        }
        
        console.log(`TradingView formatted symbol: ${chartSymbol}`);

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
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
          calendar: false,
          support_host: "https://www.tradingview.com",
          container_id: widgetContainer.id
        });

        script.onerror = () => {
            console.error("Failed to load TradingView script");
            setError("Failed to load TradingView chart library.");
        };

        widgetContainer.appendChild(script);
    };

    // Small delay to ensure container is ready and any previous cleanup finished
    const timer = setTimeout(initWidget, 100);

    return () => {
      clearTimeout(timer);
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
            {error ? (
                <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
                    {error}
                </div>
            ) : !symbol && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Select an asset to view chart
                </div>
            )}
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
