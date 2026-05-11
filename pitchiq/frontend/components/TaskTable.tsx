'use client'

import { useState } from 'react'
import type { TaskSummary, TaskBreakdown } from '@/types'
import { getTaskBreakdown } from '@/lib/api'
import AgentBreakdownRow from './AgentBreakdownRow'

interface TaskTableProps {
  tasks: TaskSummary[]
}

function statusColor(status: string) {
  if (status === 'completed') return 'text-[#22c55e]'
  if (status === 'failed') return 'text-[#ef4444]'
  if (status === 'running') return 'text-[#eab308]'
  return 'text-[#666]'
}

function statusDot(status: string) {
  if (status === 'completed') return 'bg-[#22c55e]'
  if (status === 'failed') return 'bg-[#ef4444]'
  if (status === 'running') return 'bg-[#eab308]'
  return 'bg-[#444]'
}

function scoreColor(score: number) {
  if (score >= 8.5) return 'text-[#22c55e]'
  if (score >= 6) return 'text-[#eab308]'
  if (score > 0) return 'text-[#ef4444]'
  return 'text-[#444]'
}

export default function TaskTable({ tasks }: TaskTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<Record<string, TaskBreakdown>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRowClick = async (taskId: string) => {
    if (expandedId === taskId) {
      setExpandedId(null)
      return
    }

    setExpandedId(taskId)

    if (!breakdowns[taskId]) {
      setLoadingId(taskId)
      try {
        const bd = await getTaskBreakdown(taskId)
        setBreakdowns((prev) => ({ ...prev, [taskId]: bd }))
      } catch (err) {
        console.error('Failed to load breakdown:', err)
      } finally {
        setLoadingId(null)
      }
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 text-center">
        <p className="text-[#555] text-sm">No tasks yet. Run your first task from the main page.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_60px_120px_70px_70px_60px_80px] gap-2 px-4 py-3 border-b border-[#2a2a2a]">
        {['Task', 'Tier', 'Agents', 'Score', 'Cost', 'Time', 'Status'].map((h) => (
          <span key={h} className="text-[#444] text-xs uppercase tracking-wider font-medium">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {tasks.map((task) => (
        <div key={task.task_id}>
          {/* Main row */}
          <div
            onClick={() => handleRowClick(task.task_id)}
            className={`grid grid-cols-[1fr_60px_120px_70px_70px_60px_80px] gap-2 px-4 py-3 border-b border-[#222] cursor-pointer transition-colors ${
              expandedId === task.task_id
                ? 'bg-[#1f1f1f]'
                : 'hover:bg-[#1d1d1d]'
            }`}
          >
            {/* Task text */}
            <span className="text-[#ccc] text-sm truncate" title={task.original_task}>
              {task.original_task.length > 40
                ? task.original_task.slice(0, 40) + '…'
                : task.original_task}
            </span>

            {/* Tier */}
            <span className="text-[#666] text-xs self-center capitalize">{task.user_tier}</span>

            {/* Agents */}
            <span className="text-[#555] text-xs self-center truncate">
              {task.agents_used.join(' → ')}
            </span>

            {/* Score */}
            <span className={`text-xs font-medium self-center ${scoreColor(task.critic_score)}`}>
              {task.critic_score > 0 ? `${task.critic_score.toFixed(1)}/10` : '—'}
            </span>

            {/* Cost */}
            <span className="text-[#666] text-xs self-center">
              ${task.total_cost_usd.toFixed(4)}
            </span>

            {/* Time */}
            <span className="text-[#666] text-xs self-center">
              {task.execution_time_ms > 0
                ? `${(task.execution_time_ms / 1000).toFixed(1)}s`
                : '—'}
            </span>

            {/* Status */}
            <span className={`flex items-center gap-1.5 text-xs self-center ${statusColor(task.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(task.status)}`} />
              {task.status}
            </span>
          </div>

          {/* Expanded breakdown */}
          {expandedId === task.task_id && (
            <div>
              {loadingId === task.task_id ? (
                <div className="bg-[#111] border-t border-[#222] px-4 py-4 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-[#333] border-t-[#666] animate-spin" />
                  <span className="text-[#555] text-xs">Loading breakdown...</span>
                </div>
              ) : breakdowns[task.task_id] ? (
                <AgentBreakdownRow
                  agents={breakdowns[task.task_id].agents}
                  totalCostUsd={breakdowns[task.task_id].total_cost_usd}
                  totalTokens={breakdowns[task.task_id].total_tokens}
                  executionTimeMs={breakdowns[task.task_id].execution_time_ms}
                />
              ) : (
                <div className="bg-[#111] border-t border-[#222] px-4 py-4">
                  <p className="text-[#555] text-xs">Could not load breakdown.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
