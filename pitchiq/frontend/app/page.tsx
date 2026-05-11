'use client'

import { useState } from 'react'
import Link from 'next/link'
import TaskForm from '@/components/TaskForm'
import AgentTimeline from '@/components/AgentTimeline'
import EmailCard from '@/components/EmailCard'
import CriticScore from '@/components/CriticScore'
import CostBreakdown from '@/components/CostBreakdown'
import type { TaskResponse, FinalOutput } from '@/types'

type AppState = 'idle' | 'loading' | 'results'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [result, setResult] = useState<TaskResponse | null>(null)

  const output: FinalOutput | null = result?.final_output ?? null

  const handleResult = (res: TaskResponse) => {
    setResult(res)
    setAppState('results')
  }

  const handleLoading = (loading: boolean) => {
    if (loading) setAppState('loading')
  }

  const handleReset = () => {
    setResult(null)
    setAppState('idle')
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-white font-semibold text-lg tracking-tight">PitchIQ</span>
        <Link
          href="/dashboard"
          className="text-[#555] hover:text-[#999] text-sm transition-colors"
        >
          Dashboard →
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* ── Input section ─────────────────────────────────────── */}
        <section className="space-y-6">
          {appState === 'idle' && (
            <h1 className="text-3xl font-semibold text-white text-center">
              What do you want to research?
            </h1>
          )}

          <TaskForm
            onResult={handleResult}
            onLoading={handleLoading}
            loading={appState === 'loading'}
          />

          {/* Loading state — agent list */}
          {appState === 'loading' && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[#555] text-xs uppercase tracking-wider">Running agents</p>
                <p className="text-[#444] text-xs">~2–4 min on free tier</p>
              </div>
              {['Planner', 'Researcher', 'Enricher', 'Writer', 'Critic'].map((agent) => (
                <div key={agent} className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full border-2 border-[#333] border-t-[#666] animate-spin shrink-0" />
                  <span className="text-[#666] text-sm">{agent}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Results ───────────────────────────────────────────── */}
        {appState === 'results' && output && (
          <div className="fade-in space-y-8">

            {/* Summary bar */}
            <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
              <div>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Task</p>
                <p className="text-[#ccc] text-sm line-clamp-2">{output.task}</p>
              </div>

              <div>
                <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Agents used</p>
                <AgentTimeline agents={output.agents_used} />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Total cost</p>
                  <p className="text-white font-semibold">${output.total_cost_usd.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Critic score</p>
                  <p className={`font-semibold ${
                    output.critic_score >= 8.5 ? 'text-[#22c55e]' :
                    output.critic_score >= 6   ? 'text-[#eab308]' : 'text-[#ef4444]'
                  }`}>
                    {output.critic_score.toFixed(1)} / 10
                  </p>
                </div>
                <div>
                  <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Time</p>
                  <p className="text-white font-semibold">
                    {(output.execution_time_ms / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            </section>

            {/* Emails */}
            {output.emails.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-white font-semibold text-base">
                  Emails
                  <span className="ml-2 text-[#555] font-normal text-sm">
                    ({output.emails.length})
                  </span>
                </h2>
                {output.emails.map((email, i) => (
                  <EmailCard key={i} email={email} />
                ))}
              </section>
            ) : (
              <section className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 text-center">
                <p className="text-[#555] text-sm">No emails were generated for this task.</p>
              </section>
            )}

            {/* Critic + Cost */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <p className="text-[#555] text-xs uppercase tracking-wider mb-3">Critic evaluation</p>
                <CriticScore
                  score={output.critic_score}
                  feedback={output.critic_feedback}
                />
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
                <CostBreakdown
                  totalCostUsd={output.total_cost_usd}
                  totalTokens={output.total_tokens}
                  executionTimeMs={output.execution_time_ms}
                />
              </div>
            </section>

            {/* Reset */}
            <div className="flex justify-center pb-8">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] rounded-lg text-sm font-medium transition-all"
              >
                Run Another Task
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
