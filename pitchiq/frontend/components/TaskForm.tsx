'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { runTask } from '@/lib/api'
import type { TaskResponse } from '@/types'
import { Spinner } from '@/components/ui/Spinner'

interface TaskFormProps {
  onResult: (result: TaskResponse) => void
  onLoading: (loading: boolean) => void
  loading: boolean
}

export default function TaskForm({ onResult, onLoading, loading }: TaskFormProps) {
  const [task, setTask] = useState('')
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim()) return

    setError(null)
    onLoading(true)

    try {
      const result = await runTask(task.trim(), tier)
      onResult(result)
    } catch (err) {
      setError('Something went wrong. Try again.')
      console.error(err)
    } finally {
      onLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        disabled={loading}
        rows={3}
        placeholder="Find 3 YC startups solving logistics in India and write cold emails to their founders"
        className="w-full bg-[#111] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-white/[0.16] focus:bg-[#141414] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 leading-relaxed"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
      />

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
          disabled={loading || !task.trim()}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
        >
          {loading ? (
            <>
              <Spinner size="xs" />
              Running…
            </>
          ) : (
            <>
              Run PitchIQ
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </form>
  )
}
