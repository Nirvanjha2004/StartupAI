"""Cost breakdown component showing token and monetary costs"""
import React from 'react';

interface CostBreakdownProps {
  costs?: {
    groq_tokens?: number;
    groq_cost?: number;
    claude_tokens?: number;
    claude_cost?: number;
    total_tokens?: number;
    total_cost?: number;
  };
}

export default function CostBreakdown({
  costs = {
    groq_tokens: 0,
    groq_cost: 0,
    claude_tokens: 0,
    claude_cost: 0,
    total_tokens: 0,
    total_cost: 0
  }
}: CostBreakdownProps) {
  const costItems = [
    { label: 'Groq', tokens: costs.groq_tokens || 0, cost: costs.groq_cost || 0 },
    { label: 'Claude', tokens: costs.claude_tokens || 0, cost: costs.claude_cost || 0 }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-gray-600 font-semibold mb-1">Total Cost</p>
        <p className="text-3xl font-bold text-gray-900">${(costs.total_cost || 0).toFixed(4)}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Model</p>
        <div className="space-y-3">
          {costItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900">${item.cost.toFixed(4)}</span>
              </div>
              <p className="text-xs text-gray-600">{item.tokens} tokens</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${(item.tokens / (costs.total_tokens || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-600 font-semibold">Total Tokens</p>
        <p className="text-2xl font-bold text-gray-900">{costs.total_tokens || 0}</p>
      </div>
    </div>
  );
}
