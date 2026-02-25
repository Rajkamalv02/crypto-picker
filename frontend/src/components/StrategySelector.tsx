'use client';
import React from 'react';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { Strategy } from '@/types';

interface StrategySelectorProps {
    currentStrategy: string;
    onStrategyChange: (strategy: string) => void;
    strategies: Strategy[]; // strategies prop added
    onCreateCustom?: () => void;
    onEditStrategy?: (strategyId: string) => void;
    onDeleteStrategy?: (strategyId: string) => void;
}

export default function StrategySelector({ 
    currentStrategy, 
    onStrategyChange,
    strategies, // strategies received as prop
    onCreateCustom,
    onEditStrategy,
    onDeleteStrategy
}: StrategySelectorProps) {

    const handleDelete = async (strategyId: string) => {
        if (!confirm(`Are you sure you want to delete ${strategyId}?`)) return;

        try {
            const response = await fetch(`http://localhost:5000/api/strategies/${strategyId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Now, the parent component is responsible for refetching strategies
                if (onDeleteStrategy) onDeleteStrategy(strategyId); 
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete strategy');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete strategy');
        }
    };

    const selectedStrategy = strategies.find(s => s.id === currentStrategy); // Simplified
    const selectedDescription = selectedStrategy?.description || '';
    const isCustomStrategy = selectedStrategy && !['impluse_strategy'].includes(selectedStrategy.id);

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
            <div className="flex gap-2">
                {onCreateCustom && (
                    <button
                        onClick={onCreateCustom}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                        title="Create Custom Strategy"
                    >
                        <Plus size={16} />
                        Custom
                    </button>
                )}
                {isCustomStrategy && onEditStrategy && (
                    <button
                        onClick={() => onEditStrategy(currentStrategy)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition"
                        title="Edit Strategy"
                    >
                        <Edit size={16} />
                    </button>
                )}
                {isCustomStrategy && onDeleteStrategy && (
                    <button
                        onClick={() => handleDelete(currentStrategy)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                        title="Delete Strategy"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
