'use client';
import React from 'react';
import { Asset } from '../types';

interface MarketTableProps {
    assets: Asset[];
    onSelect: (symbol: string) => void;
    selectedSymbol?: string;
}

export default function MarketTable({ assets, onSelect, selectedSymbol }: MarketTableProps) {
    return (
        <div className="overflow-x-auto bg-gray-800 rounded-t-lg border-x border-t border-gray-700">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asset</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price (INR)</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vol (24h)</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {assets.map((asset) => (
                        <tr 
                            key={asset.id || asset.symbol} 
                            className={`cursor-pointer transition-colors border-l-4 ${
                                selectedSymbol === asset.symbol 
                                    ? 'bg-gray-700 border-blue-500' 
                                    : 'border-transparent hover:bg-gray-700/50'
                            }`}
                            onClick={() => onSelect(asset.symbol)}
                        >
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <img className="h-8 w-8 rounded-full mr-3" src={asset.image} alt={asset.symbol} />
                                    <div>
                                        <div className="text-sm font-bold text-gray-100">{asset.symbol}</div>
                                        <div className="text-[10px] text-gray-400 truncate max-w-[100px]">{asset.fullName}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-200">
                                    ₹{asset.price < 1 ? asset.price.toFixed(6) : asset.price.toLocaleString('en-IN')}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 text-right">
                                ₹{asset.volume24h > 10000000 ? `${(asset.volume24h / 10000000).toFixed(2)}Cr` : asset.volume24h.toLocaleString('en-IN')}
                            </td>
                        </tr>
                    ))}
                    {assets.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                                No assets found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
