'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StrategyPanel from '@/components/StrategyPanel';
import ScannerResults, { ScanResult } from '@/components/ScannerResults';
import TradingViewChart from '@/components/TradingViewChart';
import {
    BarChart2, Search, Cpu, Coins, TrendingUp, X,
    RefreshCcw, AlertCircle, Activity, Info
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/analysis';

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

export default function AnalysisDashboard() {
    const [strategies, setStrategies]         = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [market, setMarket]                 = useState<'crypto' | 'stock'>('crypto');
    const [paramValues, setParamValues]       = useState<Record<string, number>>({});
    
    // Price Filters
    const [minPrice, setMinPrice]             = useState<string>('');
    const [maxPrice, setMaxPrice]             = useState<string>('');

    const [scanning, setScanning]             = useState(false);
    const [scanResults, setScanResults]       = useState<ScanResult[]>([]);
    const [totalScanned, setTotalScanned]     = useState(0);
    const [scanErrors, setScanErrors]         = useState<{ symbol: string; name: string; error: string }[]>([]);
    const [scanStrategyMeta, setScanStrategyMeta] = useState<{ id: string; name: string }>({ id: '', name: '' });
    const [scanMarket, setScanMarket]         = useState<string>('crypto');
    const [error, setError]                   = useState<string | null>(null);

    const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);

    // Load strategies on mount
    useEffect(() => {
        axios.get<Strategy[]>(`${API_BASE}/strategies`)
            .then(res => {
                setStrategies(res.data);
                if (res.data.length > 0) {
                    const first = res.data[0];
                    setSelectedStrategy(first);
                    // Initialise params from defaults
                    const defaults: Record<string, number> = {};
                    first.params.forEach(p => { defaults[p.key] = p.default; });
                    setParamValues(defaults);
                }
            })
            .catch(() => setError('Failed to load strategies from backend.'));
    }, []);

    // When strategy changes, reset params to defaults for that strategy
    const handleStrategyChange = useCallback((s: Strategy) => {
        setSelectedStrategy(s);
        const defaults: Record<string, number> = {};
        s.params.forEach(p => { defaults[p.key] = p.default; });
        setParamValues(defaults);
        setScanResults([]);
        setSelectedResult(null);
    }, []);

    const handleParamChange = (key: string, value: number) => {
        setParamValues(prev => ({ ...prev, [key]: value }));
    };

    const handleScan = async () => {
        if (!selectedStrategy) return;
        setScanning(true);
        setError(null);
        setSelectedResult(null);

        try {
            const res = await axios.post(`${API_BASE}/scan`, {
                market,
                strategyId: selectedStrategy.id,
                params:     paramValues,
                filters: {
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                }
            });
            setScanResults(res.data.results || []);
            setTotalScanned(res.data.totalScanned || 0);
            setScanErrors(res.data.errors || []);
            setScanStrategyMeta(res.data.strategy || { id: selectedStrategy.id, name: selectedStrategy.name });
            setScanMarket(res.data.market || market);
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Scan failed';
            setError(msg);
        } finally {
            setScanning(false);
        }
    };

    // Auto-rescan when market or strategy changes (if we already have results)
    // (Only auto-rescan if results exist so we don't scan on first load)
    useEffect(() => {
        if (scanResults.length > 0) {
            handleScan();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [market, selectedStrategy?.id]);

    return (
        <div className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/15 rounded-xl">
                        <BarChart2 className="text-purple-400" size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Strategy Analysis</h2>
                        <p className="text-xs text-gray-400">Select a strategy · pick a market · scan for best-fit assets</p>
                    </div>
                </div>

                {/* Market + Scan controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Price Range Filters */}
                    <div className="flex items-center gap-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
                        <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">Price Range</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="Min"
                                className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                            <span className="text-gray-600">-</span>
                            <input
                                type="text"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder="Max"
                                className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Market selector */}
                    <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                        <button
                            onClick={() => setMarket('crypto')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                market === 'crypto'
                                    ? 'bg-orange-500 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Coins size={13} /> Crypto
                        </button>
                        <button
                            onClick={() => setMarket('stock')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                market === 'stock'
                                    ? 'bg-green-600 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <TrendingUp size={13} /> NSE Stocks
                        </button>
                    </div>

                    {/* Scan button */}
                    <button
                        onClick={handleScan}
                        disabled={!selectedStrategy || scanning}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow ${
                            scanning
                                ? 'bg-purple-700 text-purple-200 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                        }`}
                    >
                        {scanning ? (
                            <>
                                <RefreshCcw size={14} className="animate-spin" />
                                Scanning…
                            </>
                        ) : (
                            <>
                                <Search size={14} />
                                Scan Market
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3">
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left column: Strategy panel */}
                <div className="lg:col-span-1">
                    {strategies.length > 0 ? (
                        <StrategyPanel
                            strategies={strategies}
                            selectedStrategy={selectedStrategy}
                            onStrategyChange={handleStrategyChange}
                            paramValues={paramValues}
                            onParamChange={handleParamChange}
                        />
                    ) : (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-gray-500 text-sm text-center animate-pulse">
                            Loading strategies…
                        </div>
                    )}
                </div>

                {/* Right column: Results + Chart */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Scanning skeleton */}
                    {scanning && (
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-10 text-center">
                            <Cpu size={36} className="text-purple-400 mx-auto mb-3 animate-pulse" />
                            <p className="text-gray-300 font-semibold">Running scanner engine…</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Fetching{' '}{market === 'crypto' ? '15 crypto pairs' : '25 NSE stocks'} and evaluating{' '}
                                {selectedStrategy?.name} strategy
                            </p>
                        </div>
                    )}

                    {/* Scanner results table */}
                    {!scanning && (
                        <>
                            {scanResults.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Summary Stats Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Strong Buy Setups', val: scanResults.filter(r => r.signal === 'Strong Buy Setup').length, color: 'text-green-500' },
                                            { label: 'Potential Buys', val: scanResults.filter(r => r.signal === 'Potential Buy' || r.signal === 'Pullback Setup').length, color: 'text-green-400' },
                                            { label: 'Watch List', val: scanResults.filter(r => r.signal === 'Watch List').length, color: 'text-yellow-400' },
                                            { label: 'Total Scanned', val: totalScanned, color: 'text-gray-400' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-gray-800/60 border border-gray-700/50 p-5 rounded-2xl text-center shadow-lg">
                                                <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.val}</div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Strategy Legend (Only for Impulse Strategy) */}
                                    {scanStrategyMeta.id === 'impluse_strategy' && (
                                        <div className="bg-blue-400/5 border border-blue-400/10 p-5 rounded-2xl">
                                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Info size={14} /> Strategy Conditions Checked (8 total)
                                            </div>
                                            <div className="text-[11px] text-gray-500 leading-relaxed font-medium">
                                                <span className="text-gray-400 font-bold">Above EMA</span> — Price above 19-bar EMA &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">HTF Bias</span> — Price above 50-bar EMA &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">Impulse</span> — Bullish momentum &gt; 1.0 MAD &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">Volume</span> — Volume ≥ 1.2× average &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">ADX</span> — ADX ≥ 20 (Strong Trend) &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">ATR↑</span> — Volatility expanding &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">Breakout Zone</span> — Price near upper band &nbsp;|&nbsp;
                                                <span className="text-gray-400 font-bold">Pullback</span> — Near basis with active impulse
                                            </div>
                                        </div>
                                    )}

                                    <ScannerResults
                                        results={scanResults}
                                        totalScanned={totalScanned}
                                        errors={scanErrors}
                                        strategy={scanStrategyMeta}
                                        market={scanMarket}
                                        onSelect={setSelectedResult}
                                        selectedSymbol={selectedResult?.symbol ?? null}
                                    />
                                </div>
                            ) : !error && (
                                <div className="bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 p-14 text-center">
                                    <Activity size={48} className="text-gray-600 mx-auto mb-4 animate-pulse" />
                                    <p className="text-gray-400 text-lg font-medium">Ready to scan</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Select a strategy and click <span className="text-purple-400 font-semibold">Scan Market</span> to see ranked results
                                    </p>
                                </div>
                            )}

                            {/* Chart for selected result */}
                            {selectedResult && (
                                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                <Activity size={16} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{selectedResult.name}</div>
                                                <div className="text-xs text-gray-500">{selectedResult.symbol} · {selectedResult.market} · {selectedResult.signal}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedResult(null)}
                                            className="text-gray-500 hover:text-white transition p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <TradingViewChart symbol={selectedResult.symbol} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
