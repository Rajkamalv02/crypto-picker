'use client';
import { useState } from 'react';
import MarketDashboard from '@/components/MarketDashboard';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import RecentListingsDashboard from '@/components/RecentListingsDashboard';
import { Activity, LayoutDashboard, TrendingUp, BarChart2 } from 'lucide-react';

type Tab = 'crypto' | 'stock' | 'analysis' | 'recent';

export default function Home() {
    const [activeTab, setActiveTab] = useState<Tab>('crypto');

    const tabs: { id: Tab; label: string; icon: React.ReactNode; activeClass: string }[] = [
        {
            id:          'crypto',
            label:       'Crypto Market',
            icon:        <LayoutDashboard size={18} className="mr-2" />,
            activeClass: 'bg-blue-600 text-white shadow-lg',
        },
        {
            id:          'stock',
            label:       'Indian Stocks',
            icon:        <TrendingUp size={18} className="mr-2" />,
            activeClass: 'bg-green-600 text-white shadow-lg',
        },
        {
            id:          'recent',
            label:       'Recent Listings',
            icon:        <Activity size={18} className="mr-2" />,
            activeClass: 'bg-orange-600 text-white shadow-lg',
        },
        {
            id:          'analysis',
            label:       'Analysis',
            icon:        <BarChart2 size={18} className="mr-2" />,
            activeClass: 'bg-purple-600 text-white shadow-lg',
        },
    ];

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <Activity className="mr-3 text-blue-500" /> Smart Picker <span className="text-blue-500 ml-2">India</span>
                        </h1>
                        <p className="text-gray-400">Real-time trading suggestions &amp; fee calculator for Crypto and Stocks.</p>
                    </div>
                </header>

                {/* Tab Switcher */}
                <div className="flex space-x-2 mb-8 bg-gray-800 p-1 rounded-xl w-fit border border-gray-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? tab.activeClass
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dashboard Content */}
                <div key={activeTab}>
                    {activeTab === 'crypto' && <MarketDashboard type="crypto" />}
                    {activeTab === 'stock'  && <MarketDashboard type="stock"  />}
                    {activeTab === 'recent' && <RecentListingsDashboard />}
                    {activeTab === 'analysis' && <AnalysisDashboard />}
                </div>
            </div>
        </main>
    );
}
