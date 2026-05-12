'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap, ArrowLeft, Star, DollarSign, Clock,
  AlertCircle, CheckCircle2,
} from 'lucide-react'
import EmailCard from '@/components/EmailCard'
import AgentTimeline from '@/components/AgentTimeline'
import AgentBreakdownRow from '@/components/AgentBreakdownRow'
import { getTask, getTaskBreakdown } from '@/lib/api'
import type { TaskResponse, TaskBreakdown } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { StatsCardSkeleton } from '@/components/ui/SkeletonCard'

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [task, setTask] = useState<TaskResponse | null>(null)
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [t, b] = await Promise.all([
          getTask(params.id),
          getTaskBreakdown(params.id).catch(() => null),
        ])
        setTask(t)
        setBreakdown(b)
      } catch {
        setError('Could not load task results.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const output = task?.final_output

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-3.5 border-b border-white/[0.05] flex items-center justify-between"
        style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="w-px h-4 bg-white/[0.08]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">PitchIQ</span>
          </div>
        </div>
        <span className="text-zinc-600 text-xs font-mono truncate max-w-xs">{params.id}</span>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
            <div className="surface-card p-8 flex items-center justify-center gap-3">
              <Spinner size="md" />
              <span className="text-zinc-600 text-sm">Loading results…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="surface-card p-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && output && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Task header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <Badge variant="success">Completed</Badge>
              </div>
              <h1 className="text-zinc-100 font-semibold text-lg leading-snug">{output.task}</h1>
              {output.task_summary && (
                <p className="text-zinc-500 text-sm leading-relaxed">{output.task_summary}</p>
              )}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Score',
                  value: output.critic_score > 0 ? `${output.critic_score.toFixed(1)}/10` : '—',
                  icon: Star,
                  color: output.critic_score >= 8.5 ? 'text-emerald-400' : output.critic_score >= 6 ? 'text-amber-400' : 'text-red-400',
                },
                {
                  label: 'Cost',
                  value: `$${output.total_cost_usd.toFixed(4)}`,
                  icon: DollarSign,
                  color: 'text-zinc-200',
                },
                {
                  label: 'Time',
                  value: `${(output.execution_time_ms / 1000).toFixed(1)}s`,
                  icon: Clock,
                  color: 'text-zinc-200',
                },
                {
                  label: 'Emails',
                  value: String(output.emails.length),
                  icon: CheckCircle2,
                  color: 'text-zinc-200',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="surface-card p-4 space-y-2">
                  <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {label}
                  </p>
                  <p className={`font-bold text-xl leading-none font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Pipeline + feedback */}
            <div className="surface-card p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Pipeline</p>
                <AgentTimeline agents={output.agents_used} />
              </div>
              {output.critic_feedback && (
                <div className="pt-3 border-t border-white/[0.05] space-y-1.5">
                  <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Critic Feedback</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{output.critic_feedback}</p>
                </div>
              )}
            </div>

            {/* Agent breakdown */}
            {breakdown && (
              <div className="surface-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.05]">
                  <h2 className="text-zinc-300 font-semibold text-sm">Agent Breakdown</h2>
                </div>
                <AgentBreakdownRow
                  agents={breakdown.agents}
                  totalCostUsd={breakdown.total_cost_usd}
                  totalTokens={breakdown.total_tokens}
                  executionTimeMs={breakdown.execution_time_ms}
                />
              </div>
            )}

            {/* Emails */}
            {output.emails.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-zinc-200 font-semibold text-sm">Generated Emails</h2>
                  <Badge variant="success">{output.emails.length}</Badge>
                </div>
                <div className="space-y-3">
                  {output.emails.map((email, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <EmailCard email={email} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
