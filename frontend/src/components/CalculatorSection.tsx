'use client';
import React from 'react';
import { ChargeBreakdown } from '../types';
import { Calculator, IndianRupee } from 'lucide-react';

interface CalculatorSectionProps {
    buyCharges: ChargeBreakdown;
    sellCharges: ChargeBreakdown;
    investmentAmount: number;
    onAmountChange: (amount: number) => void;
}

export default function CalculatorSection({ buyCharges, sellCharges, investmentAmount, onAmountChange }: CalculatorSectionProps) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 h-full">
            <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <Calculator className="mr-2 text-blue-500" size={20} /> Investment & Charges
            </h3>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Investment Amount (INR)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="number"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        value={investmentAmount}
                        onChange={(e) => onAmountChange(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-sm text-green-400 mb-3 border-b border-green-900 pb-1">Buy Scenario</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Brokerage (0.5%)</span>
                            <span className="text-gray-200">₹{buyCharges.brokerage.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">GST (18% on fee)</span>
                            <span className="text-gray-200">₹{buyCharges.gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-700 mt-2">
                            <span className="text-gray-300">Net Asset Value</span>
                            <span className="text-green-400">₹{buyCharges.netAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-sm text-red-400 mb-3 border-b border-red-900 pb-1">Sell Scenario</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Brokerage (0.5%)</span>
                            <span className="text-gray-200">₹{sellCharges.brokerage.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">GST (18% on fee)</span>
                            <span className="text-gray-200">₹{sellCharges.gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-400">
                            <span className="text-gray-400">TDS (1%)</span>
                            <span className="text-red-400">₹{sellCharges.tds.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-700 mt-2">
                            <span className="text-gray-300">Net Payout</span>
                            <span className="text-red-400">₹{sellCharges.netAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-900/50 rounded text-[10px] text-gray-500 border border-gray-800">
                Calculations are based on real-world exchange fee structures as of 2026. 
                TDS applies on sell transactions per Indian Income Tax guidelines.
            </div>
        </div>
    );
}