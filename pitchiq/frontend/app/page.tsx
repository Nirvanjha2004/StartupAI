"""Main page component"""
import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            PitchIQ
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered email generation for startup outreach
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* TaskForm component will be inserted here */}
          <p className="text-gray-600">Task form component goes here</p>
        </div>
      </div>
    </main>
  );
}
