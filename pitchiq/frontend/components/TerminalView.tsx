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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  return (
    <div className="flex flex-col h-[480px] rounded-2xl overflow-hidden border border-white/[0.06]"
      style={{
        background: '#050505',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.04) 0%, transparent 55%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] shrink-0"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] opacity-70" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] opacity-70" />
        </div>
        <span className="text-zinc-600 text-xs font-mono ml-2 tracking-wide">pitchiq — agent pipeline</span>
        {running && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            live
          </span>
        )}
        {!running && events.length > 0 && (
          <span className="ml-auto text-[11px] text-zinc-600 font-mono">
            {events.length} events
          </span>
        )}
      </div>

      {/* Log area */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-0.5 font-mono">
        {events.length === 0 && (
          <div className="flex items-center gap-2 py-1">
            <span className="text-zinc-700 text-sm">$</span>
            <span className="text-zinc-600 text-sm animate-pulse">Waiting for pipeline to start...</span>
          </div>
        )}
        {events.map((event, i) => (
          <TerminalLine key={i} event={event} />
        ))}
        {running && (
          <div className="flex items-center gap-1 mt-1.5 py-0.5">
            <span className="text-emerald-500 text-sm" style={{ animation: 'pulse 1s step-end infinite' }}>▌</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
