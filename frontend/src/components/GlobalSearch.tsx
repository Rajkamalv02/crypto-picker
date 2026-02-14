'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import { Asset, MarketDataResponse } from '@/types';

interface GlobalSearchProps {
    onSelect: (symbol: string) => void;
    apiBase: string;
    placeholder?: string;
}

export default function GlobalSearch({ onSelect, apiBase, placeholder }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchAssets = async () => {
            if (!query) {
                setResults([]);
                return;
            }
            
            setLoading(true);
            try {
                // Limit to 5 results for dropdown
                const res = await axios.get<MarketDataResponse>(`${apiBase}/market`, {
                    params: { search: query, limit: 5 }
                });
                setResults(res.data.assets);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchAssets, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-md" ref={wrapperRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg leading-5 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-gray-700 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder={placeholder || "Search for asset..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>

            {isOpen && (results.length > 0 || query) && (
                <div className="absolute z-50 mt-1 w-full bg-gray-800 shadow-lg rounded-md border border-gray-700 max-h-60 overflow-auto">
                    {results.length > 0 ? (
                        <ul className="py-1">
                            {results.map((asset) => (
                                <li 
                                    key={asset.symbol}
                                    onClick={() => handleSelect(asset.symbol)}
                                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center transition-colors"
                                >
                                    <img src={asset.image} alt={asset.symbol} className="h-6 w-6 rounded-full mr-3" />
                                    <div>
                                        <div className="text-sm font-medium text-white">{asset.fullName}</div>
                                        <div className="text-xs text-gray-400">{asset.symbol}</div>
                                    </div>
                                    <div className="ml-auto text-sm text-gray-300">
                                        ₹{asset.price < 1 ? asset.price.toFixed(6) : asset.price.toLocaleString('en-IN')}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        query && !loading && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                No assets found.
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
