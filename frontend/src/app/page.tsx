'use client';
import { useState } from 'react';
import MarketDashboard from '@/components/MarketDashboard';
import { Activity, LayoutDashboard, TrendingUp } from 'lucide-react';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'crypto' | 'stock'>('crypto');

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <Activity className="mr-3 text-blue-500" /> Smart Picker <span className="text-blue-500 ml-2">India</span>
                        </h1>
                        <p className="text-gray-400">Real-time trading suggestions & fee calculator for Crypto and Stocks.</p>
                    </div>
                </header>

                {/* Tab Switcher */}
                <div className="flex space-x-4 mb-8 bg-gray-800 p-1 rounded-xl w-fit border border-gray-700">
                    <button
                        onClick={() => setActiveTab('crypto')}
                        className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                            activeTab === 'crypto'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <LayoutDashboard className="mr-2" size={20} />
                        Crypto Market
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                            activeTab === 'stock'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                        <TrendingUp className="mr-2" size={20} />
                        Indian Stock Market
                    </button>
                </div>

                {/* Dashboard Content */}
                <div key={activeTab}>
                    {activeTab === 'crypto' ? (
                        <MarketDashboard type="crypto" />
                    ) : (
                        <MarketDashboard type="stock" />
                    )}
                </div>
            </div>
        </main>
    );
}
