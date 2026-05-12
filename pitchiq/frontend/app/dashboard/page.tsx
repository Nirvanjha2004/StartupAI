'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap, ArrowLeft, LayoutGrid, TrendingUp,
  DollarSign, Clock, Star, AlertCircle,
} from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import TaskTable from '@/components/TaskTable'
import SimpleBarChart from '@/components/SimpleBarChart'
import { getDashboardStats, getDashboardTasks } from '@/lib/api'
import type { DashboardStats, TaskSummary } from '@/types'
import { StatsCardSkeleton } from '@/components/ui/SkeletonCard'
import { Spinner } from '@/components/ui/Spinner'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0 },
}

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}

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

  // ── Chart data ──────────────────────────────────────────────────────────────
  const costByModel: Record<string, number> = {}
  for (const task of tasks) {
    const model = task.user_tier === 'premium' ? 'llama-3.1 (premium)' : 'llama-3.1 (free)'
    costByModel[model] = (costByModel[model] || 0) + task.total_cost_usd
  }
  const costChartItems = Object.entries(costByModel).map(([label, value]) => ({
    label,
    value,
    displayValue: `$${value.toFixed(4)}`,
    color: '#22c55e',
  }))

  const scoreBuckets = [
    { label: '9–10',  min: 9,   max: 10,   color: '#22c55e' },
    { label: '8–8.9', min: 8,   max: 8.99, color: '#86efac' },
    { label: '7–7.9', min: 7,   max: 7.99, color: '#f59e0b' },
    { label: '< 7',   min: 0,   max: 6.99, color: '#f87171' },
  ]
  const scoreChartItems = scoreBuckets.map(({ label, min, max, color }) => {
    const count = tasks.filter(
      (t) => t.critic_score >= min && t.critic_score <= max && t.critic_score > 0
    ).length
    return { label, value: count, displayValue: `${count} task${count !== 1 ? 's' : ''}`, color }
  })

  const successRate = stats && stats.total_tasks > 0
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
    : null

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-6 py-3.5 border-b border-white/[0.05] flex items-center justify-between"
        style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-sm transition-colors duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div className="w-px h-4 bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">PitchIQ</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-zinc-500 text-sm">
            <LayoutGrid className="w-3.5 h-3.5" />
            Dashboard
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10 space-y-8">

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
            <div className="surface-card p-8 flex items-center justify-center gap-3">
              <Spinner size="md" />
              <span className="text-zinc-600 text-sm">Loading dashboard data…</span>
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="surface-card p-6 flex items-center gap-3 border-red-500/20">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-zinc-200 text-sm font-medium">Failed to load</p>
              <p className="text-red-400 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {!loading && !error && stats && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {/* Page title */}
            <motion.div variants={fadeUp} className="space-y-1">
              <h1 className="text-white font-bold text-2xl tracking-tight">Overview</h1>
              <p className="text-zinc-600 text-sm">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} · all time
              </p>
            </motion.div>

            {/* Stats grid */}
            <motion.section variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                label="Total Tasks"
                value={String(stats.total_tasks)}
                sub={`${stats.completed_tasks} completed · ${stats.failed_tasks} failed`}
                icon={LayoutGrid}
                accent="default"
              />
              <StatsCard
                label="Total Spent"
                value={`$${stats.total_cost_usd.toFixed(4)}`}
                sub={`${stats.total_tokens.toLocaleString()} tokens used`}
                icon={DollarSign}
                accent="green"
              />
              <StatsCard
                label="Avg Score"
                value={
                  stats.average_critic_score > 0
                    ? `${stats.average_critic_score.toFixed(1)}/10`
                    : '—'
                }
                sub={successRate !== null ? `${successRate}% success rate` : undefined}
                icon={Star}
                accent={
                  stats.average_critic_score >= 8.5 ? 'green' :
                  stats.average_critic_score >= 6   ? 'amber' : 'red'
                }
              />
              <StatsCard
                label="Avg Time"
                value={
                  stats.average_execution_time_ms > 0
                    ? `${(stats.average_execution_time_ms / 1000).toFixed(1)}s`
                    : '—'
                }
                sub="per pipeline run"
                icon={Clock}
                accent="blue"
              />
            </motion.section>

            {/* Charts */}
            <motion.section variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </motion.section>

            {/* Task history */}
            <motion.section variants={fadeUp} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-zinc-200 font-semibold text-sm">Task History</h2>
                  <span className="text-zinc-600 text-xs font-mono">({tasks.length})</span>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
                >
                  <TrendingUp className="w-3 h-3" />
                  New task
                </Link>
              </div>
              <TaskTable tasks={tasks} />
            </motion.section>
          </motion.div>
        )}
      </main>
    </div>
  )
}
