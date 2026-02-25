'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MarketTable from '@/components/MarketTable';
import AssetDetailView from '@/components/AssetDetailView';
import SignalSection from '@/components/SignalSection';
import CalculatorSection from '@/components/CalculatorSection';
import StrategySelector from '@/components/StrategySelector';
import TradingViewChart from '@/components/TradingViewChart';
import { Asset, AssetDetailResponse, MarketDataResponse, Strategy } from '@/types';
import { RefreshCcw, Activity, Terminal, Coins, Briefcase } from 'lucide-react';

export default function RecentListingsDashboard() {
    const [subType, setSubType] = useState<'crypto' | 'stock'>('crypto');
    const API_BASE = subType === 'crypto' 
        ? 'http://localhost:5000/api' 
        : 'http://localhost:5000/api/stock';

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [detailData, setDetailData] = useState<AssetDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState(1000);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const fetchRecent = async () => {
        try {
            setLoading(true);
            const res = await axios.get<MarketDataResponse>(`${API_BASE}/recently-listed`, {
                params: { limit: 10 }
            });
            setAssets(res.data.assets);
            addLog(`Loaded ${res.data.assets.length} recently listed ${subType} assets.`);
        } catch (err) {
            addLog(`Error fetching recent ${subType} listings.`);
        } finally {
            setLoading(false);
        }
    };

    const fetchStrategies = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/analysis/strategies');
            const data = await response.json();
            if (Array.isArray(data)) {
                setStrategies(data);
                if (data.length > 0) {
                    const impulseStrategy = data.find(s => s.id === 'impluse_strategy');
                    setSelectedStrategy(impulseStrategy ? 'impluse_strategy' : data[0].id);
                }
            }
        } catch (error: any) {
            addLog('Error fetching strategies: ' + error.message);
        }
    };

    useEffect(() => {
        fetchRecent();
    }, [subType]);

    useEffect(() => {
        fetchStrategies();
    }, []);

    useEffect(() => {
        if (selectedSymbol && selectedStrategy) {
            fetchDetail(selectedSymbol, investmentAmount, selectedStrategy);
        }
    }, [selectedSymbol, investmentAmount, selectedStrategy]);

    const fetchDetail = async (symbol: string, amount: number, strategy: string) => {
        try {
            setDetailLoading(true);
            addLog(`Analyzing ${symbol} with ${strategy}...`);
            const res = await axios.get(`${API_BASE}/asset/${symbol}`, {
                params: { amount, strategy }
            });
            setDetailData(res.data);
            addLog(`${symbol}: Signal ${res.data.strategy.signal} (${res.data.strategy.reason})`);
        } catch (err) {
            addLog(`Error analyzing ${symbol}.`);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <section className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center">
                            <Activity className="mr-2 text-orange-500" size={20} /> New Listings
                        </h2>
                    </div>

                    <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700">
                        <button
                            onClick={() => { setSubType('crypto'); setSelectedSymbol(null); setDetailData(null); }}
                            className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${subType === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Coins size={16} className="mr-2" /> Crypto
                        </button>
                        <button
                            onClick={() => { setSubType('stock'); setSelectedSymbol(null); setDetailData(null); }}
                            className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${subType === 'stock' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Briefcase size={16} className="mr-2" /> Stocks
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400 border border-gray-700">Loading new listings...</div>
                    ) : (
                        <div className="flex flex-col space-y-0 shadow-lg">
                            <MarketTable 
                                assets={assets} 
                                onSelect={setSelectedSymbol} 
                                selectedSymbol={selectedSymbol || undefined} 
                            />
                        </div>
                    )}
                </section>

                <section className="bg-gray-950 rounded-lg p-4 text-green-400 font-mono text-xs shadow-lg h-56 overflow-hidden border border-gray-800">
                    <div className="flex items-center mb-2 border-b border-gray-800 pb-2 text-gray-500 uppercase tracking-tighter">
                        <Terminal size={12} className="mr-2" /> System Logs
                    </div>
                    <div className="space-y-1 overflow-y-auto h-40">
                        {logs.map((log, i) => (
                            <div key={i} className="border-l-2 border-green-900 pl-2 mb-1">{log}</div>
                        ))}
                    </div>
                </section>

                <button 
                    onClick={fetchRecent}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                    <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Listings
                </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {!selectedSymbol ? (
                    <div className="bg-gray-800 p-20 rounded-lg shadow text-center border-2 border-dashed border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
                        <Activity size={64} className="text-gray-600 mb-4 animate-pulse" />
                        <div className="text-gray-400 text-xl font-medium">Select a recently listed asset</div>
                        <p className="text-gray-500 mt-2">Analyze new market opportunities with real-time data</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                         <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
                            <TradingViewChart 
                                symbol={selectedSymbol} 
                                strategy={selectedStrategy} 
                            />
                        </div>

                        {strategies.length > 0 && selectedStrategy && (
                            <StrategySelector 
                                strategies={strategies}
                                currentStrategy={selectedStrategy}
                                onStrategyChange={setSelectedStrategy}
                                onDeleteStrategy={fetchStrategies}
                            />
                        )}

                        {detailLoading && !detailData ? (
                            <div className="bg-gray-800 p-20 rounded-lg shadow text-center text-gray-400">Analyzing market dynamics...</div>
                        ) : detailData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-1">
                                    <AssetDetailView data={detailData} />
                                </div>
                                <div className="md:col-span-1">
                                    <SignalSection strategy={detailData.strategy} />
                                </div>
                                <div className="md:col-span-2">
                                    <CalculatorSection 
                                        buyCharges={detailData.calculator.buy}
                                        sellCharges={detailData.calculator.sell}
                                        investmentAmount={investmentAmount}
                                        onAmountChange={setInvestmentAmount}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
