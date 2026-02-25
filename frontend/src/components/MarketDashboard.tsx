'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import MarketTable from '@/components/MarketTable';
import AssetDetailView from '@/components/AssetDetailView';
import SignalSection from '@/components/SignalSection';
import CalculatorSection from '@/components/CalculatorSection';
import Filters from '@/components/Filters';
import Pagination from '@/components/Pagination';
import GlobalSearch from '@/components/GlobalSearch';
import TradingViewChart from '@/components/TradingViewChart';
import StrategySelector from '@/components/StrategySelector';
import { Asset, AssetDetailResponse, MarketDataResponse, Strategy } from '@/types'; // Import Strategy type
import { RefreshCcw, Activity, Terminal } from 'lucide-react';

interface MarketDashboardProps {
    type: 'crypto' | 'stock';
}

export default function MarketDashboard({ type }: MarketDashboardProps) {
    const API_BASE = type === 'crypto' 
        ? 'http://localhost:5000/api' 
        : 'http://localhost:5000/api/stock';

    const [assets, setAssets] = useState<Asset[]>([]);
    const [totalAssets, setTotalAssets] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(type === 'crypto' ? 1000 : 100000);

    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [strategies, setStrategies] = useState<Strategy[]>([]); // Add strategies state
    const [selectedStrategy, setSelectedStrategy] = useState<string>(''); // Initialize as empty string
    const [detailData, setDetailData] = useState<AssetDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState(1000);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    const fetchMarket = async () => {
        try {
            setLoading(true);
            const res = await axios.get<MarketDataResponse>(`${API_BASE}/market`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search,
                    minPrice,
                    maxPrice
                }
            });
            setAssets(res.data.assets);
            setTotalAssets(res.data.total);
            addLog(`Loaded ${res.data.assets.length} ${type} assets.`);
        } catch (err) {
            addLog(`Error fetching ${type} market data.`);
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
                    // Set selectedStrategy to 'impluse_strategy' if available, otherwise the first one
                    const impulseStrategy = data.find(s => s.id === 'impluse_strategy');
                    if (impulseStrategy) {
                        setSelectedStrategy('impluse_strategy');
                    } else {
                        setSelectedStrategy(data[0].id);
                    }
                }
            } else {
                addLog('API did not return an array for strategies. Found: ' + JSON.stringify(data));
                setStrategies([]);
            }
        } catch (error: any) { // Type 'any' for error to access message
            addLog('Error fetching strategies: ' + error.message);
            console.error('Failed to fetch strategies:', error);
            setStrategies([]);
        }
    };

    useEffect(() => {
        fetchMarket();
    }, [currentPage, search, minPrice, maxPrice]);

    useEffect(() => {
        fetchStrategies(); // Fetch strategies on mount
    }, []);

    useEffect(() => {
        if (selectedSymbol && selectedStrategy) { // Ensure selectedStrategy is not empty
            fetchDetail(selectedSymbol, investmentAmount, selectedStrategy);
        }
    }, [selectedSymbol, investmentAmount, selectedStrategy]);

    const handleFilterChange = (filters: { search: string; minPrice: number; maxPrice: number }) => {
        setSearch(filters.search);
        setMinPrice(filters.minPrice);
        setMaxPrice(filters.maxPrice);
        setCurrentPage(1);
    };

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
            {/* Market Overview Section */}
            <div className="lg:col-span-1 space-y-6">
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            {type} Market Overview
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full border border-blue-800">
                            {totalAssets} Assets Found
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <GlobalSearch 
                            apiBase={API_BASE} 
                            onSelect={setSelectedSymbol} 
                            placeholder={type === 'crypto' ? "Search e.g. BTC, ETH..." : "Search e.g. RELIANCE, TCS..."}
                        />
                    </div>
                    
                    <Filters 
                        onFilterChange={handleFilterChange} 
                        initialMinPrice={minPrice} 
                        initialMaxPrice={maxPrice} 
                    />

                    {loading ? (
                        <div className="bg-gray-800 p-8 rounded-lg shadow text-center text-gray-400 border border-gray-700">Loading assets...</div>
                    ) : (
                        <div className="flex flex-col space-y-0 shadow-lg">
                            <MarketTable 
                                assets={assets} 
                                onSelect={setSelectedSymbol} 
                                selectedSymbol={selectedSymbol || undefined} 
                            />
                            <Pagination 
                                currentPage={currentPage}
                                totalItems={totalAssets}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </section>

                {/* Logs Section */}
                <section className="bg-gray-950 rounded-lg p-4 text-green-400 font-mono text-xs shadow-lg h-56 overflow-hidden border border-gray-800">
                    <div className="flex items-center mb-2 border-b border-gray-800 pb-2 text-gray-500 uppercase tracking-tighter">
                        <Terminal size={12} className="mr-2" /> {type} System Logs
                    </div>
                    <div className="space-y-1 overflow-y-auto h-40">
                        {logs.map((log, i) => (
                            <div key={i} className="border-l-2 border-green-900 pl-2 mb-1">{log}</div>
                        ))}
                    </div>
                </section>
                
                <button 
                    onClick={fetchMarket}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh {type} Data
                </button>
            </div>

            {/* Detailed Analysis Section */}
            <div className="lg:col-span-2 space-y-6">
                {!selectedSymbol ? (
                    <div className="bg-gray-800 p-20 rounded-lg shadow text-center border-2 border-dashed border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
                        <Activity size={64} className="text-gray-600 mb-4 animate-pulse" />
                        <div className="text-gray-400 text-xl font-medium">Select a {type} asset to begin analysis</div>
                        <p className="text-gray-500 mt-2">Get real-time indicators and fee breakdowns</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                             <div className="flex items-center">
                                 <div className="p-2 bg-blue-500/10 rounded-lg mr-4">
                                    <Activity className="text-blue-500" size={24} />
                                 </div>
                                 <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedSymbol} Analysis</h2>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">{type} Data & Intelligence</div>
                                 </div>
                             </div>
                        </div>

                        {/* TradingView Chart */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
                            <TradingViewChart 
                                symbol={type === 'stock' ? selectedSymbol : selectedSymbol} 
                                strategy={selectedStrategy} 
                            />
                        </div>

                        {strategies.length > 0 && selectedStrategy && ( // Conditionally render and pass strategies
                            <StrategySelector 
                                strategies={strategies}
                                currentStrategy={selectedStrategy}
                                onStrategyChange={setSelectedStrategy}
                                onDeleteStrategy={fetchStrategies} // Pass fetchStrategies to re-fetch after deletion
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
