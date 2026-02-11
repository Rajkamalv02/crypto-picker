'use client';
import React, { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
    symbol: string;
    strategy?: string;
}

export default function TradingViewChart({ symbol, strategy }: TradingViewChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="h-[500px] w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl" ref={containerRef}>
            <TradingViewWidgetContent
                symbol={symbol}
                strategy={strategy}
            />
        </div>
    );
}

interface TradingViewWidgetContentProps {
    symbol: string;
    strategy?: string;
}

function TradingViewWidgetContent({ symbol }: TradingViewWidgetContentProps) {
    const widgetContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!widgetContainerRef.current || !symbol) return;

        const studies = [];
        const studies_overrides = {};

        // Ensure the container is empty before injecting the new script
        // This is important because React might reuse the DOM node even with a new key,
        // so explicitly clearing it guarantees a clean slate.
        widgetContainerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;

        const tvSymbol = `BINANCE:${symbol}USDT`;

        script.text = JSON.stringify({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "D",
            "timezone": "Asia/Kolkata",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "calendar": true,
            "hide_volume": true,
            "studies": studies,
            "studies_overrides": studies_overrides,
            "support_host": "https://www.tradingview.com",
            "hide_side_toolbar": false,
            "withdateranges": true,
            "allow_symbol_change": true,
            "enabled_features": [
                "study_dialog_autofill_properties",
                "right_toolbar_button_group",
                "sidebar_button_group",
                "header_widget",
                "legend_context_menu",
                "property_pages",
                "create_alert_from_toolbar",
                "show_trading_panel",
                "popup_hints",
                "scales_context_menu",
                "pane_context_menu",
                "timezone_dialog",
                "trading_notifications",
                "widget_templates",
                "order_panel",
                "create_volume_profile"
            ],
            "disabled_features": [
                "use_localstorage_for_settings",
                "context_menus",
                "control_bar",
                "border_around_the_chart",
                "header_screenshot",
                "header_saveload",
                "header_widget_dom_node",
                "header_chart_type",
                "header_compare",
                "header_undo_redo",
                "header_fullscreen",
                "header_settings",
                "header_symbol_search",
                "show_popup_button",
                "show_object_tree"
            ]
        });

        widgetContainerRef.current.appendChild(script);

        // Cleanup function: remove the injected content when the component unmounts
        return () => {
            if (widgetContainerRef.current) {
                widgetContainerRef.current.innerHTML = '';
            }
        };
    }, [symbol]); // Removed 'strategy' from dependencies

    return (
        <div className="tradingview-widget-container__widget h-full w-full" ref={widgetContainerRef}>
            {/* TradingView widget will be injected here */}
        </div>
    );
}
