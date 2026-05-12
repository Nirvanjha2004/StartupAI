'use client'

import { useEffect, useRef } from 'react'
import type { TaskEvent } from '@/types'
import TerminalLine from './TerminalLine'

interface TerminalViewProps {
  events: TaskEvent[]
  running: boolean
}

export default function TerminalView({ events, running }: TerminalViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div className="flex flex-col h-[500px] bg-[#0a0a0a] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-zinc-700" />
          <span className="w-3 h-3 rounded-full bg-zinc-700" />
          <span className="w-3 h-3 rounded-full bg-zinc-700" />
        </div>
        <span className="text-zinc-500 text-xs font-mono ml-2">pitchiq terminal</span>
        {running && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            running
          </span>
        )}
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {events.length === 0 && (
          <span className="text-zinc-600 font-mono text-sm">Waiting for events...</span>
        )}
        {events.map((event, i) => (
          <TerminalLine key={i} event={event} />
        ))}
        {/* Blinking cursor while running */}
        {running && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-zinc-500 font-mono text-sm animate-pulse">▌</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
