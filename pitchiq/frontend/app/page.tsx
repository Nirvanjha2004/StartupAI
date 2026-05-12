'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, LayoutDashboard, ArrowRight, RotateCcw,
  Sparkles, ChevronRight, Clock, DollarSign, Star,
} from 'lucide-react'
import EmailCard from '@/components/EmailCard'
import AgentTimeline from '@/components/AgentTimeline'
import TerminalView from '@/components/TerminalView'
import AgentStatusPanel, { type AgentState } from '@/components/AgentStatusPanel'
import { getTask, streamTask } from '@/lib/api'
import type { TaskEvent, FinalOutput } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type AppMode = 'idle' | 'running' | 'completed' | 'error'

const ALL_AGENTS = ['planner', 'researcher', 'enricher', 'writer', 'critic']

function initAgents(): AgentState[] {
  return ALL_AGENTS.map((name) => ({ name, status: 'waiting' as const }))
}

const EXAMPLE_PROMPTS = [
  'Find 3 YC startups solving logistics in India and write cold emails to their founders',
  'Research 5 Series A fintech companies in Europe and draft personalized outreach',
  'Find AI infrastructure startups that raised in 2024 and write emails to their CTOs',
]

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  useEffect(() => {
    return () => { cleanupSSERef.current?.() }
  }, [])

  const handleEvent = useCallback((event: TaskEvent) => {
    setEvents((prev) => [...prev, event])

    if (event.type === 'plan_ready' && event.agents) {
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
      if (event.tokens) setLiveTokens((t) => t + event.tokens!)
      if (event.cost_usd) setLiveCost((c) => c + event.cost_usd!)
    }
    if (event.type === 'task_failed') {
      setAgents((prev) => prev.map((a) =>
        a.status === 'running' ? { ...a, status: 'failed' } : a
      ))
    }
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.trim(), user_tier: tier }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Request failed: ${res.status}`)
      }
      const { task_id } = await res.json()

      const cleanup = streamTask(
        task_id,
        handleEvent,
        async () => {
          try {
            const result = await getTask(task_id)
            setFinalOutput(result.final_output)
            setMode('completed')
          } catch {
            setMode('completed')
          }
        },
      )
      cleanupSSERef.current = cleanup
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
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const isRunning = mode === 'running'
  const showTerminal = mode === 'running' || mode === 'completed'

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-6 py-3.5 border-b border-white/[0.05] flex items-center justify-between"
        style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-glow-green">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">PitchIQ</span>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] text-sm transition-all duration-150"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="flex-1 w-full px-4 py-8">

        {/* ── IDLE ─────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {mode === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto pt-14 space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
                  <Sparkles className="w-3 h-3" />
                  Multi-agent AI pipeline
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white leading-[1.15]">
                  Research to cold email
                  <br />
                  <span className="gradient-text-green">in seconds</span>
                </h1>
                <p className="text-zinc-500 text-base leading-relaxed max-w-md mx-auto">
                  Describe your target companies. PitchIQ researches, enriches, and writes
                  personalized outreach — automatically.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as React.FormEvent)
                    }}
                    rows={4}
                    placeholder="Find 3 YC startups solving logistics in India and write cold emails to their founders"
                    className="w-full bg-[#111] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-white/[0.16] focus:bg-[#141414] transition-all duration-200 leading-relaxed"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
                  />
                  <div className="absolute bottom-3 right-3 text-zinc-700 text-[11px] font-mono pointer-events-none">
                    ⌘↵ to run
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Tier toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-white/[0.08] bg-[#111] p-0.5 gap-0.5">
                    {(['free', 'premium'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTier(t)}
                        className={`px-3.5 py-1.5 text-xs font-medium capitalize rounded-lg transition-all duration-150 ${
                          tier === t
                            ? t === 'premium'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'bg-white/[0.08] text-zinc-200 border border-white/[0.10]'
                            : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {t === 'premium' && <span className="mr-1">✦</span>}
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!task.trim()}
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                  >
                    Run PitchIQ
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Example prompts */}
              <div className="space-y-2">
                <p className="text-zinc-700 text-xs font-medium uppercase tracking-wider">Try an example</p>
                <div className="space-y-1.5">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setTask(prompt)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#111] border border-white/[0.05] text-zinc-500 text-sm hover:text-zinc-300 hover:border-white/[0.10] hover:bg-[#141414] transition-all duration-150 flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                      <span className="truncate">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RUNNING / COMPLETED ──────────────────────────────────────────── */}
          {showTerminal && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-6xl mx-auto space-y-5"
            >
              {/* Task bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isRunning && (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-xs font-medium">Running</span>
                    </span>
                  )}
                  {mode === 'completed' && (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400 text-xs font-medium">Completed</span>
                    </span>
                  )}
                  <span className="text-zinc-500 text-sm truncate">{task}</span>
                  <Badge variant={tier === 'premium' ? 'premium' : 'outline'}>
                    {tier === 'premium' && '✦ '}
                    {tier}
                  </Badge>
                </div>

                {mode === 'completed' && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 btn btn-ghost shrink-0 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New task
                  </button>
                )}
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4">
                <TerminalView events={events} running={isRunning} />
                <AgentStatusPanel
                  agents={agents}
                  stats={{ tokens: liveTokens, costUsd: liveCost, elapsedMs }}
                />
              </div>

              {/* Results */}
              <AnimatePresence>
                {mode === 'completed' && finalOutput && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-5 pt-1"
                  >
                    {/* Summary strip */}
                    <div className="surface-card px-5 py-4">
                      <div className="flex flex-wrap gap-6 items-start">
                        <div className="space-y-1.5">
                          <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Pipeline</p>
                          <AgentTimeline agents={finalOutput.agents_used} />
                        </div>

                        <div className="space-y-1">
                          <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" /> Score
                          </p>
                          <p className={`font-bold text-lg leading-none ${
                            finalOutput.critic_score >= 8.5 ? 'text-emerald-400' :
                            finalOutput.critic_score >= 6   ? 'text-amber-400'   : 'text-red-400'
                          }`}>
                            {finalOutput.critic_score > 0 ? `${finalOutput.critic_score.toFixed(1)}` : '—'}
                            <span className="text-zinc-600 text-sm font-normal ml-0.5">/10</span>
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Cost
                          </p>
                          <p className="text-zinc-200 font-semibold text-sm font-mono">
                            ${finalOutput.total_cost_usd.toFixed(4)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Time
                          </p>
                          <p className="text-zinc-200 font-semibold text-sm font-mono">
                            {(finalOutput.execution_time_ms / 1000).toFixed(1)}s
                          </p>
                        </div>

                        {finalOutput.critic_feedback && (
                          <div className="w-full pt-1 border-t border-white/[0.05]">
                            <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium mb-1.5">Feedback</p>
                            <p className="text-zinc-400 text-sm leading-relaxed">{finalOutput.critic_feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emails */}
                    {finalOutput.emails.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h2 className="text-zinc-200 font-semibold text-sm">Generated Emails</h2>
                          <Badge variant="success">{finalOutput.emails.length}</Badge>
                        </div>
                        <div className="space-y-3">
                          {finalOutput.emails.map((email, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08, duration: 0.3 }}
                            >
                              <EmailCard email={email} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="surface-card p-8 text-center">
                        <p className="text-zinc-600 text-sm">No emails were generated for this task.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── ERROR ──────────────────────────────────────────────────────── */}
          {mode === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto pt-20 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <span className="text-red-400 text-xl">✗</span>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-200 font-medium text-sm">Something went wrong</p>
                <p className="text-red-400 text-sm">{errorMsg}</p>
              </div>
              <button onClick={handleReset} className="btn btn-secondary mx-auto">
                <RotateCcw className="w-3.5 h-3.5" />
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
