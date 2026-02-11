
'use client';
import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Strategy } from '@/types';

interface StrategySelectorProps {
    currentStrategy: string;
    onStrategyChange: (strategy: string) => void;
}

export default function StrategySelector({ currentStrategy, onStrategyChange }: StrategySelectorProps) {
    const [strategies, setStrategies] = useState<Strategy[]>([]);

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/strategies');
                const data = await response.json();
                setStrategies(data);
            } catch (error) {
                console.error('Failed to fetch strategies:', error);
            }
        };
        fetchStrategies();
    }, []);

    const selectedDescription = strategies.find(s => s.id === currentStrategy)?.description || '';

    return (
        <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <Settings className="text-gray-400" size={20} />
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300">Active Strategy</label>
                <select
                    value={currentStrategy}
                    onChange={(e) => onStrategyChange(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-700 text-white"
                >
                    {strategies.map((strategy) => (
                        <option key={strategy.id} value={strategy.id}>
                            {strategy.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="text-xs text-gray-500 max-w-[200px]">
                {selectedDescription}
            </div>
        </div>
    );
}

