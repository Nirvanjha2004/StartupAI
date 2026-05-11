"""Agent execution timeline visualization"""
import React from 'react';

interface AgentStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  output?: string;
}

interface AgentTimelineProps {
  stages: AgentStage[];
}

export default function AgentTimeline({ stages }: AgentTimelineProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⏳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${getStatusColor(stage.status)}`}>
              {getStatusIcon(stage.status)}
            </div>
            {index < stages.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
            )}
          </div>

          {/* Stage content */}
          <div className="flex-1 pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 capitalize">{stage.name}</h3>
              <span className="text-sm text-gray-600">{stage.duration}ms</span>
            </div>
            {stage.output && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {stage.output.substring(0, 200)}...
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
