'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import TaskTable from '@/components/TaskTable'
import SimpleBarChart from '@/components/SimpleBarChart'
import { getDashboardStats, getDashboardTasks } from '@/lib/api'
import type { DashboardStats, TaskSummary } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([getDashboardStats(), getDashboardTasks()])
        setStats(s)
        setTasks(t)
      } catch (err) {
        setError('Failed to load dashboard data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived chart data ──────────────────────────────────────────────────────

  // Cost by model — infer from task data (best-effort)
  const costByModel: Record<string, number> = {}
  for (const task of tasks) {
    // All tasks currently use Groq (llama-3.1-8b-instant)
    const model = task.user_tier === 'premium' ? 'llama-3.1 (premium)' : 'llama-3.1 (free)'
    costByModel[model] = (costByModel[model] || 0) + task.total_cost_usd
  }
  const costChartItems = Object.entries(costByModel).map(([label, value]) => ({
    label,
    value,
    displayValue: `$${value.toFixed(4)}`,
    color: '#22c55e',
  }))

  // Score distribution
  const scoreBuckets = [
    { label: '9–10', min: 9, max: 10, color: '#22c55e' },
    { label: '8–8.9', min: 8, max: 8.99, color: '#86efac' },
    { label: '7–7.9', min: 7, max: 7.99, color: '#eab308' },
    { label: '< 7', min: 0, max: 6.99, color: '#ef4444' },
  ]
  const scoreChartItems = scoreBuckets.map(({ label, min, max, color }) => {
    const count = tasks.filter(
      (t) => t.critic_score >= min && t.critic_score <= max && t.critic_score > 0
    ).length
    return {
      label: `${label}`,
      value: count,
      displayValue: `${count} task${count !== 1 ? 's' : ''}`,
      color,
    }
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-[#1a1a1a] flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-lg tracking-tight hover:text-[#ccc] transition-colors">
          PitchIQ
        </Link>
        <span className="text-[#555] text-sm">Dashboard</span>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10 space-y-8">

        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-5 h-5 rounded-full border-2 border-[#333] border-t-[#666] animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-[#1a1a1a] border border-[#ef444433] rounded-xl p-5 text-center">
            <p className="text-[#ef4444] text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* Stats bar */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                label="Total Tasks"
                value={String(stats.total_tasks)}
                sub={`${stats.completed_tasks} completed · ${stats.failed_tasks} failed`}
              />
              <StatsCard
                label="Total Spent"
                value={`$${stats.total_cost_usd.toFixed(4)}`}
                sub={`${stats.total_tokens.toLocaleString()} tokens`}
              />
              <StatsCard
                label="Avg Score"
                value={
                  stats.average_critic_score > 0
                    ? `${stats.average_critic_score.toFixed(1)} / 10`
                    : '—'
                }
              />
              <StatsCard
                label="Avg Time"
                value={
                  stats.average_execution_time_ms > 0
                    ? `${(stats.average_execution_time_ms / 1000).toFixed(1)}s`
                    : '—'
                }
              />
            </section>

            {/* Task history */}
            <section className="space-y-3">
              <h2 className="text-white font-semibold text-sm">
                Task History
                <span className="ml-2 text-[#555] font-normal">
                  (last {tasks.length})
                </span>
              </h2>
              <TaskTable tasks={tasks} />
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SimpleBarChart
                title="Cost by Model"
                items={costChartItems}
                emptyMessage="No cost data yet"
              />
              <SimpleBarChart
                title="Score Distribution"
                items={scoreChartItems}
                emptyMessage="No scored tasks yet"
              />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
