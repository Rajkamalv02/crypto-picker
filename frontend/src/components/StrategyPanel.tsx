'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Settings2 } from 'lucide-react';

interface StrategyParam {
    key: string;
    label: string;
    type: 'int' | 'float';
    default: number;
    min: number;
    max: number;
}

interface Strategy {
    id: string;
    name: string;
    description: string;
    params: StrategyParam[];
}

interface StrategyPanelProps {
    strategies: Strategy[];
    selectedStrategy: Strategy | null;
    onStrategyChange: (strategy: Strategy) => void;
    paramValues: Record<string, number>;
    onParamChange: (key: string, value: number) => void;
}

export default function StrategyPanel({
    strategies,
    selectedStrategy,
    onStrategyChange,
    paramValues,
    onParamChange,
}: StrategyPanelProps) {
    const [showParams, setShowParams] = useState(false);

    return (
        <div className="space-y-4">
            {/* Strategy Selector */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Settings2 size={16} className="text-blue-400" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Select Strategy</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {strategies.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { onStrategyChange(s); setShowParams(false); }}
                            className={`text-left px-4 py-3 rounded-lg border transition-all duration-150 ${
                                selectedStrategy?.id === s.id
                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                    : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:border-blue-500/50 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <div className="font-semibold text-sm">{s.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Description + Parameters */}
            {selectedStrategy && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {/* Description */}
                    <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-300 leading-relaxed">{selectedStrategy.description}</p>
                        </div>
                    </div>

                    {/* Parameters toggle */}
                    <button
                        onClick={() => setShowParams(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition text-sm text-gray-300"
                    >
                        <span className="flex items-center gap-2">
                            <Settings2 size={14} className="text-gray-500" />
                            Strategy Parameters
                        </span>
                        {showParams ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showParams && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50">
                            <p className="text-xs text-gray-500 mt-3">Adjust parameters before scanning. Changes take effect on next scan.</p>
                            {selectedStrategy.params.map(p => (
                                <div key={p.key} className="flex items-center justify-between gap-4">
                                    <label className="text-xs text-gray-400 flex-1">{p.label}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={paramValues[p.key] ?? p.default}
                                            min={p.min}
                                            max={p.max}
                                            step={p.type === 'float' ? 0.1 : 1}
                                            onChange={e => {
                                                const v = p.type === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value);
                                                if (!isNaN(v)) onParamChange(p.key, v);
                                            }}
                                            className="w-20 text-right bg-gray-900 border border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
