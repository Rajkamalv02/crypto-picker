'use client';
import React from 'react';
import { AssetDetailResponse } from '../types';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

interface AssetDetailViewProps {
    data: AssetDetailResponse;
}

export default function AssetDetailView({ data }: AssetDetailViewProps) {
    const { asset } = data;
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 h-full">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                    <img src={asset.image} alt={asset.symbol} className="w-12 h-12 mr-4 rounded-full" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{asset.fullName}</h2>
                        <span className="text-gray-400">{asset.symbol}/INR</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-400">₹{asset.price.toLocaleString('en-IN')}</div>
                    <div className={`flex items-center justify-end ${asset.changePct24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {asset.changePct24h >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                        {asset.changePct24h.toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700/50 rounded border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">24h High</div>
                    <div className="text-lg font-semibold text-green-400">₹{asset.high24h.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-4 bg-gray-700/50 rounded border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">24h Low</div>
                    <div className="text-lg font-semibold text-red-400">₹{asset.low24h.toLocaleString('en-IN')}</div>
                </div>
                <div className="p-4 bg-gray-700/50 rounded col-span-2 flex items-center justify-between border border-gray-700">
                    <div>
                        <div className="text-sm text-gray-400 mb-1 flex items-center">
                            <BarChart2 size={14} className="mr-1" /> Traded Volume
                        </div>
                        <div className="text-lg font-semibold text-white">₹{asset.volume24h.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}