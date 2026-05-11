'use client'

import { useState } from 'react'
import { runTask } from '@/lib/api'
import type { TaskResponse } from '@/types'

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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Textarea */}
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        disabled={loading}
        rows={3}
        placeholder="Find 3 YC startups solving logistics in India and write cold emails to their founders"
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] text-base resize-none focus:outline-none focus:border-[#444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      />

      {/* Tier + Submit row */}
      <div className="flex items-center gap-3">
        {/* Tier toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
          <button
            type="button"
            onClick={() => setTier('free')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tier === 'free'
                ? 'bg-[#2a2a2a] text-white'
                : 'bg-transparent text-[#666] hover:text-[#999]'
            }`}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => setTier('premium')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tier === 'premium'
                ? 'bg-[#2a2a2a] text-white'
                : 'bg-transparent text-[#666] hover:text-[#999]'
            }`}
          >
            Premium
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !task.trim()}
          className={`flex-1 py-2 px-6 rounded-lg font-medium text-sm transition-all ${
            loading
              ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] cursor-not-allowed'
              : 'bg-white text-black hover:bg-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-[#444] border-t-[#888] animate-spin" />
              Running...
            </span>
          ) : (
            'Run PitchIQ →'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </form>
  )
}
