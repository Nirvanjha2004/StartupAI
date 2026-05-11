"""Observability dashboard"""
import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">TOTAL REQUESTS</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">TOTAL TOKENS</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">TOTAL COST</p>
            <p className="text-3xl font-bold text-gray-900">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">AVG LATENCY</p>
            <p className="text-3xl font-bold text-gray-900">0ms</p>
          </div>
        </div>
        
        {/* Charts and detailed info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
            <p className="text-gray-600">Chart placeholder</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cost by Model</h2>
            <p className="text-gray-600">Chart placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
