'use client';
import React from 'react';
import { StrategyResult } from '../types';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';

interface SignalSectionProps {
    strategy: StrategyResult;
}

export default function SignalSection({ strategy }: SignalSectionProps) {
    const getSignalColor = () => {
        switch (strategy.signal) {
            case 'BUY': return 'bg-green-900/30 text-green-400 border border-green-800';
            case 'SELL': return 'bg-red-900/30 text-red-400 border border-red-800';
            default: return 'bg-gray-700 text-gray-300 border border-gray-600';
        }
    };

    const getProbabilityColor = (prob: number) => {
        if (prob > 0.7) return 'text-green-400';
        if (prob > 0.5) return 'text-blue-400';
        return 'text-orange-400';
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <ShieldCheck className="mr-2 text-blue-500" size={20} /> Trading Signal Engine
            </h3>

            <div className={`p-6 rounded-xl border-2 text-center mb-6 ${getSignalColor()}`}>
                <div className="text-sm font-medium uppercase tracking-wider mb-1 opacity-75">Current Recommendation</div>
                <div className="text-4xl font-black">{strategy.signal}</div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                    <span className="text-gray-400 flex items-center"><Info size={14} className="mr-1" /> Probability of Profit</span>
                    <span className={`font-bold text-xl ${getProbabilityColor(strategy.probability)}`}>
                        {(strategy.probability * 100).toFixed(1)}%
                    </span>
                </div>
                
                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-900/50">
                    <div className="text-xs font-bold text-blue-400 uppercase mb-2">Mathematical Rationale</div>
                    <p className="text-sm text-blue-200 leading-relaxed">
                        {strategy.reason}
                    </p>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                    <AlertCircle size={12} className="mr-1" />
                    Probabilities are calculated using historical statistical hit-rates.
                </div>
            </div>
        </div>
    );
}