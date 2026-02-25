'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, BarChart3, Info } from 'lucide-react';

export interface ScanResult {
    rank:       number;
    name:       string;
    symbol:     string;
    market:     string;
    price:      number;
    changePct:  number;
    signal:     string;
    score:      number;
    maxScore:   number;
    confidence: number;
    reason:     string;
    details:    Record<string, unknown>;
    tvSymbol:   string;
}

interface ScannerResultsProps {
    results:      ScanResult[];
    totalScanned: number;
    errors:       { symbol: string; name: string; error: string }[];
    strategy:     { id: string; name: string };
    market:       string;
    onSelect:     (result: ScanResult) => void;
    selectedSymbol: string | null;
}

const SIGNAL_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    'Strong Buy Setup': { color: '#00C853', bg: 'rgba(0,200,83,0.12)',  border: 'rgba(0,200,83,0.3)' },
    'Potential Buy':    { color: '#64DD17', bg: 'rgba(100,221,23,0.12)',border: 'rgba(100,221,23,0.3)' },
    'Pullback Setup':   { color: '#0091EA', bg: 'rgba(0,145,234,0.12)', border: 'rgba(0,145,234,0.3)' },
    'Watch List':       { color: '#FFD600', bg: 'rgba(255,214,0,0.12)', border: 'rgba(255,214,0,0.3)' },
    'Neutral':          { color: '#888888', bg: 'rgba(136,136,136,0.1)',border: 'rgba(136,136,136,0.2)'},
    'Avoid':            { color: '#555555', bg: 'rgba(85,85,85,0.1)',   border: 'rgba(85,85,85,0.2)' },
};

function SignalBadge({ signal }: { signal: string }) {
    const cfg = SIGNAL_CONFIG[signal] || SIGNAL_CONFIG['Neutral'];
    return (
        <span
            className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
            {signal}
        </span>
    );
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
    const pct   = (score / maxScore) * 100;
    let color = "#888";
    if (score >= 6) color = "#00C853";
    else if (score >= 4) color = "#FFD600";
    else color = "#FF3D00";

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-900 rounded h-2 overflow-hidden border border-gray-700">
                <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-sm transition-all duration-300 shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
            </div>
            <span className="text-xs font-bold min-w-[28px]" style={{ color }}>{score}/{maxScore}</span>
        </div>
    );
}

function ConditionDots({ conditions }: { conditions: Record<string, boolean> }) {
    const condMap: Record<string, string> = {
        aboveBasis    : "Above EMA",
        aboveHtfEma   : "HTF Bias",
        impulseActive : "Impulse",
        volumeStrong  : "Volume",
        adxStrong     : "ADX",
        atrExpanding  : "ATR↑",
        nearBreakout  : "Breakout Zone",
        pullbackSetup : "Pullback",
    };

    return (
        <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(condMap).map(([key, label]) => {
                const active = conditions[key];
                return (
                    <span 
                        key={key}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-colors ${
                            active 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-gray-800 text-gray-600 border-gray-700'
                        }`}
                    >
                        {active ? '✓' : '✗'} {label}
                    </span>
                );
            })}
        </div>
    );
}

export default function ScannerResults({
    results, totalScanned, errors, strategy, market, onSelect, selectedSymbol
}: ScannerResultsProps) {

    if (results.length === 0) {
        return (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center shadow-inner">
                <BarChart3 size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No results to display yet. Run a scan to see rankings.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-800/60 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-400/10 rounded-lg">
                        <Award size={20} className="text-yellow-400" />
                    </div>
                    <div>
                        <div className="text-base font-bold text-white tracking-tight">{strategy.name} — Market Scan</div>
                        <div className="text-xs text-gray-500 font-medium">
                            <span className="text-gray-400">{market === 'crypto' ? '🪙 Crypto (4H)' : '📈 NSE Stocks (1D)'}</span>
                            <span className="mx-2 text-gray-700">|</span>
                            {totalScanned} symbols scanned
                        </div>
                    </div>
                </div>
                {errors.length > 0 && (
                    <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-1.5">
                        <Info size={13} />
                        {errors.length} symbols failed
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-700/50 bg-gray-900/20">
                            <th className="px-6 py-3 text-left w-12">#</th>
                            <th className="px-6 py-3 text-left">Instrument</th>
                            <th className="px-6 py-3 text-right">Price</th>
                            <th className="px-6 py-3 text-center">Signal</th>
                            <th className="px-6 py-3 text-left min-w-[180px]">Score</th>
                            <th className="px-6 py-3 text-left min-w-[200px]">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {results.map((r) => {
                            const isSelected = selectedSymbol === r.symbol;
                            const isPositive = r.changePct >= 0;
                            const details = r.details as any;
                            
                            return (
                                <tr
                                    key={r.symbol}
                                    onClick={() => onSelect(r)}
                                    className={`group cursor-pointer transition-all duration-150 ${
                                        isSelected
                                            ? 'bg-blue-600/10'
                                            : 'hover:bg-white/[0.03]'
                                    }`}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-4 align-top">
                                        <div className={`text-xs font-bold ${r.rank <= 3 ? 'text-yellow-400 scale-110' : 'text-gray-600'}`}>
                                            {r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : r.rank.toString().padStart(2, '0')}
                                        </div>
                                    </td>

                                    {/* Symbol */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{r.name}</div>
                                        <div className="text-gray-500 text-[10px] font-mono mt-0.5">{r.symbol} · {r.market}</div>
                                    </td>

                                    {/* Price */}
                                    <td className="px-6 py-4 text-right align-top">
                                        <div className="text-[#00FFD5] font-mono font-bold text-sm">
                                            ₹{r.price.toLocaleString('en-IN', { 
                                                maximumFractionDigits: r.price < 1 ? 4 : 2,
                                                minimumFractionDigits: r.price < 1 ? 2 : 2
                                            })}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            EMA: {details?.basis || 'N/A'}
                                        </div>
                                    </td>

                                    {/* Signal */}
                                    <td className="px-6 py-4 text-center align-top">
                                        <SignalBadge signal={r.signal} />
                                    </td>

                                    {/* Score bar */}
                                    <td className="px-6 py-4 align-top">
                                        <ScoreBar score={r.score} maxScore={r.maxScore} />
                                    </td>

                                    {/* Details */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-wrap gap-x-3 text-[10px] font-semibold">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">ADX:</span>
                                                <span className={parseFloat(details?.adxNow) >= 20 ? 'text-green-400' : 'text-red-400'}>
                                                    {details?.adxNow || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Vol×:</span>
                                                <span className={parseFloat(details?.volRatio) >= 1.2 ? 'text-green-400' : 'text-gray-500'}>
                                                    {details?.volRatio || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Imp:</span>
                                                <span className={parseFloat(details?.impulseStrength) >= 1.0 ? 'text-[#00FFD5]' : 'text-gray-500'}>
                                                    {details?.impulseStrength || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        {details?.conditions && <ConditionDots conditions={details.conditions} />}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
