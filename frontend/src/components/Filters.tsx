'use client';
import React, { useState, useEffect } from 'react';
import { Search, IndianRupee } from 'lucide-react';

interface FiltersProps {
    onFilterChange: (filters: { search: string; minPrice: number; maxPrice: number }) => void;
    initialMinPrice?: number;
    initialMaxPrice?: number;
}

export default function Filters({ onFilterChange, initialMinPrice = 0, initialMaxPrice = 100000 }: FiltersProps) {
    const [search, setSearch] = useState('');
    const [minPrice, setMinPrice] = useState(initialMinPrice.toString());
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice.toString());

    // Sync internal state when initial props change (e.g., tab switching)
    useEffect(() => {
        setMinPrice(initialMinPrice.toString());
        setMaxPrice(initialMaxPrice.toString());
        setSearch('');
    }, [initialMinPrice, initialMaxPrice]);

    // Debounce filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({
                search,
                minPrice: parseFloat(minPrice) || 0,
                maxPrice: parseFloat(maxPrice) || 0,
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [search, minPrice, maxPrice]);

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow space-y-4 border border-gray-700">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or symbol..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Min Price (INR)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="number"
                            className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Max Price (INR)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="number"
                            className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-white"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            {parseFloat(minPrice) > parseFloat(maxPrice) && (
                <p className="text-xs text-red-400 mt-1">Min price cannot be greater than max price.</p>
            )}
        </div>
    );
}
