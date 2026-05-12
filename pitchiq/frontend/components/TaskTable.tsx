'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import type { TaskSummary, TaskBreakdown } from '@/types'
import { getTaskBreakdown } from '@/lib/api'
import AgentBreakdownRow from './AgentBreakdownRow'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { TableRowSkeleton } from '@/components/ui/SkeletonCard'

interface TaskTableProps {
  tasks: TaskSummary[]
}

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'default' {
  if (status === 'completed') return 'success'
  if (status === 'failed')    return 'error'
  if (status === 'running')   return 'warning'
  return 'default'
}

function scoreColor(score: number): string {
  if (score >= 8.5) return 'text-emerald-400'
  if (score >= 6)   return 'text-amber-400'
  if (score > 0)    return 'text-red-400'
  return 'text-zinc-700'
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
      <div className="surface-card p-12 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto">
          <ExternalLink className="w-4 h-4 text-zinc-600" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">No tasks yet</p>
          <p className="text-zinc-600 text-xs mt-1">Run your first task from the main page to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="surface-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_56px_130px_68px_72px_60px_88px_24px] gap-2 px-4 py-3 border-b border-white/[0.06]">
        {['Task', 'Tier', 'Agents', 'Score', 'Cost', 'Time', 'Status', ''].map((h) => (
          <span key={h} className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {tasks.map((task, idx) => (
        <div key={task.task_id}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleRowClick(task.task_id)}
            onKeyDown={(e) => e.key === 'Enter' && handleRowClick(task.task_id)}
            className={`grid grid-cols-[1fr_56px_130px_68px_72px_60px_88px_24px] gap-2 px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-all duration-150 ${
              expandedId === task.task_id
                ? 'bg-white/[0.03]'
                : 'hover:bg-white/[0.02]'
            } ${idx === tasks.length - 1 && expandedId !== task.task_id ? 'border-b-0' : ''}`}
          >
            {/* Task */}
            <span className="text-zinc-300 text-xs truncate self-center" title={task.original_task}>
              {task.original_task.length > 48
                ? task.original_task.slice(0, 48) + '…'
                : task.original_task}
            </span>

            {/* Tier */}
            <span className="self-center">
              <Badge variant={task.user_tier === 'premium' ? 'premium' : 'outline'}>
                {task.user_tier}
              </Badge>
            </span>

            {/* Agents */}
            <span className="text-zinc-600 text-[11px] self-center truncate font-mono">
              {task.agents_used.join(' → ')}
            </span>

            {/* Score */}
            <span className={`text-xs font-semibold self-center font-mono tabular-nums ${scoreColor(task.critic_score)}`}>
              {task.critic_score > 0 ? `${task.critic_score.toFixed(1)}/10` : '—'}
            </span>

            {/* Cost */}
            <span className="text-zinc-500 text-xs self-center font-mono tabular-nums">
              ${task.total_cost_usd.toFixed(4)}
            </span>

            {/* Time */}
            <span className="text-zinc-500 text-xs self-center font-mono tabular-nums">
              {task.execution_time_ms > 0 ? `${(task.execution_time_ms / 1000).toFixed(1)}s` : '—'}
            </span>

            {/* Status */}
            <span className="self-center">
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
            </span>

            {/* Expand icon */}
            <span className="self-center text-zinc-700">
              {expandedId === task.task_id
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />
              }
            </span>
          </div>

          {/* Expanded breakdown */}
          <AnimatePresence>
            {expandedId === task.task_id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {loadingId === task.task_id ? (
                  <div className="bg-[#0d0d0d] border-t border-white/[0.04] px-4 py-4 space-y-2">
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </div>
                ) : breakdowns[task.task_id] ? (
                  <AgentBreakdownRow
                    agents={breakdowns[task.task_id].agents}
                    totalCostUsd={breakdowns[task.task_id].total_cost_usd}
                    totalTokens={breakdowns[task.task_id].total_tokens}
                    executionTimeMs={breakdowns[task.task_id].execution_time_ms}
                  />
                ) : (
                  <div className="bg-[#0d0d0d] border-t border-white/[0.04] px-4 py-4">
                    <p className="text-zinc-600 text-xs">Could not load breakdown.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
