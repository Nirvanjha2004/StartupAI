'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import EmailCard from '@/components/EmailCard'
import AgentTimeline from '@/components/AgentTimeline'
import TerminalView from '@/components/TerminalView'
import AgentStatusPanel, { type AgentState } from '@/components/AgentStatusPanel'
import { runTask, streamTask } from '@/lib/api'
import type { TaskEvent, FinalOutput } from '@/types'

type AppMode = 'idle' | 'running' | 'completed' | 'error'

const ALL_AGENTS = ['planner', 'researcher', 'enricher', 'writer', 'critic']

function initAgents(): AgentState[] {
  return ALL_AGENTS.map((name) => ({ name, status: 'waiting' as const }))
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>('idle')
  const [task, setTask] = useState('')
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [agents, setAgents] = useState<AgentState[]>(initAgents())
  const [liveTokens, setLiveTokens] = useState(0)
  const [liveCost, setLiveCost] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalOutput, setFinalOutput] = useState<FinalOutput | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cleanupSSERef = useRef<(() => void) | null>(null)

  // Elapsed timer
  useEffect(() => {
    if (mode === 'running') {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [mode])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { cleanupSSERef.current?.() }
  }, [])

  const handleEvent = useCallback((event: TaskEvent) => {
    setEvents((prev) => [...prev, event])

    // Update agent statuses
    if (event.type === 'plan_ready' && event.agents) {
      // Mark all non-planned agents as waiting, planned ones as waiting
      setAgents(initAgents())
    }

    if (event.type === 'agent_started' && event.agent) {
      setAgents((prev) => prev.map((a) =>
        a.name === event.agent ? { ...a, status: 'running' } : a
      ))
    }

    if (event.type === 'agent_completed' && event.agent) {
      setAgents((prev) => prev.map((a) =>
        a.name === event.agent
          ? { ...a, status: 'done', latencyMs: event.latency_ms }
          : a
      ))
      // Accumulate live stats
      if (event.tokens) setLiveTokens((t) => t + event.tokens!)
      if (event.cost_usd) setLiveCost((c) => c + event.cost_usd!)
    }

    if (event.type === 'task_failed') {
      setAgents((prev) => prev.map((a) =>
        a.status === 'running' ? { ...a, status: 'failed' } : a
      ))
    }
  }, [])

  const handleDone = useCallback(() => {
    // SSE stream closed — pipeline finished
    // final_output comes from the POST response, already set
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim() || mode === 'running') return

    setMode('running')
    setEvents([])
    setAgents(initAgents())
    setLiveTokens(0)
    setLiveCost(0)
    setElapsedMs(0)
    setFinalOutput(null)
    setErrorMsg(null)

    try {
      // Start pipeline + SSE stream concurrently
      // SSE stream starts immediately; POST completes when pipeline finishes
      const taskPromise = runTask(task.trim(), tier)

      // We don't have task_id yet — POST returns it after completion
      // So we start SSE after getting task_id from the response
      const result = await taskPromise

      // Connect SSE (may already be done, but catches any missed events)
      const cleanup = streamTask(result.task_id, handleEvent, handleDone)
      cleanupSSERef.current = cleanup

      setFinalOutput(result.final_output)
      setMode('completed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.'
      setErrorMsg(msg)
      setMode('error')
    }
  }

  const handleReset = () => {
    cleanupSSERef.current?.()
    setMode('idle')
    setTask('')
    setEvents([])
    setAgents(initAgents())
    setFinalOutput(null)
    setErrorMsg(null)
  }

  const isRunning = mode === 'running'
  const showTerminal = mode === 'running' || mode === 'completed'

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <span className="text-white font-semibold text-lg tracking-tight">PitchIQ</span>
        </div>
        <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">
          Dashboard →
        </Link>
      </header>

      <main className="flex-1 w-full px-4 py-8">

        {/* ── IDLE: centered input ─────────────────────────────────────── */}
        {mode === 'idle' && (
          <div className="max-w-2xl mx-auto pt-16 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold text-white">
                What do you want to research?
              </h1>
              <p className="text-zinc-500 text-sm">
                AI-powered outreach. Research to email in seconds.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={4}
                placeholder="Find 3 YC startups solving logistics in India and write cold emails to their founders"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <div className="flex items-center gap-3">
                {/* Tier toggle */}
                <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                  {(['free', 'premium'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        tier === t
                          ? 'bg-zinc-700 text-white border-zinc-500'
                          : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!task.trim()}
                  className="flex-1 bg-zinc-100 text-zinc-900 font-medium rounded-lg px-6 py-2.5 text-sm hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Run PitchIQ →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── RUNNING / COMPLETED: two-column terminal view ───────────── */}
        {showTerminal && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Task bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 text-sm truncate max-w-lg">{task}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                  tier === 'premium'
                    ? 'border-amber-700 text-amber-500'
                    : 'border-zinc-700 text-zinc-500'
                }`}>
                  {tier}
                </span>
              </div>
              {mode === 'completed' && (
                <button
                  onClick={handleReset}
                  className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  ← New task
                </button>
              )}
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              {/* Left: terminal */}
              <TerminalView events={events} running={isRunning} />

              {/* Right: agent status */}
              <AgentStatusPanel
                agents={agents}
                stats={{ tokens: liveTokens, costUsd: liveCost, elapsedMs }}
              />
            </div>

            {/* Results — slide in when completed */}
            {mode === 'completed' && finalOutput && (
              <div className="fade-in space-y-6 pt-2">
                {/* Summary strip */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 flex flex-wrap gap-6">
                  <div>
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Agents</p>
                    <AgentTimeline agents={finalOutput.agents_used} />
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Score</p>
                    <p className={`font-semibold text-sm ${
                      finalOutput.critic_score >= 8.5 ? 'text-green-400' :
                      finalOutput.critic_score >= 6   ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {finalOutput.critic_score > 0 ? `${finalOutput.critic_score.toFixed(1)} / 10` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Cost</p>
                    <p className="text-zinc-300 font-semibold text-sm">${finalOutput.total_cost_usd.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Time</p>
                    <p className="text-zinc-300 font-semibold text-sm">{(finalOutput.execution_time_ms / 1000).toFixed(1)}s</p>
                  </div>
                  {finalOutput.critic_feedback && (
                    <div className="w-full">
                      <p className="text-zinc-600 text-xs uppercase tracking-wider mb-1">Feedback</p>
                      <p className="text-zinc-400 text-sm">{finalOutput.critic_feedback}</p>
                    </div>
                  )}
                </div>

                {/* Emails */}
                {finalOutput.emails.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-zinc-300 font-medium text-sm">
                      Emails
                      <span className="ml-2 text-zinc-600 font-normal">({finalOutput.emails.length})</span>
                    </h2>
                    {finalOutput.emails.map((email, i) => (
                      <EmailCard key={i} email={email} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 text-center">
                    <p className="text-zinc-600 text-sm">No emails were generated.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────── */}
        {mode === 'error' && (
          <div className="max-w-2xl mx-auto pt-16 space-y-4 text-center">
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              ← Try again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
