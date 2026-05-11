"""Results page for a specific task"""
import React from 'react';

export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Task Results</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Email Draft</h2>
              {/* EmailResult component will go here */}
              <p className="text-gray-600">Email result component goes here</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Execution Timeline</h2>
              {/* AgentTimeline component will go here */}
              <p className="text-gray-600">Agent timeline component goes here</p>
            </div>
          </div>
          
          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-2xl font-semibold mb-4">Cost Breakdown</h2>
              {/* CostBreakdown component will go here */}
              <p className="text-gray-600">Cost breakdown component goes here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
