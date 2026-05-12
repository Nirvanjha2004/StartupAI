import type { TaskEvent } from '@/types'

interface TerminalLineProps {
  event: TaskEvent
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toTimeString().slice(0, 8)
  } catch {
    return ''
  }
}

const AGENT_COLORS: Record<string, string> = {
  planner:    '#a78bfa',
  researcher: '#60a5fa',
  enricher:   '#34d399',
  writer:     '#f59e0b',
  critic:     '#f472b6',
}

function agentColor(agent: string): string {
  return AGENT_COLORS[agent?.toLowerCase()] || '#71717a'
}

export default function TerminalLine({ event }: TerminalLineProps) {
  const time = formatTime(event.timestamp)
  const agent = event.agent

  const timeEl = (
    <span className="text-zinc-700 text-[11px] shrink-0 tabular-nums select-none">{time}</span>
  )

  if (event.type === 'task_started') {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        {timeEl}
        <span className="text-zinc-400 text-sm">
          <span className="text-zinc-600 mr-1.5">▶</span>
          {event.message}
        </span>
      </div>
    )
  }

  if (event.type === 'plan_ready') {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        {timeEl}
        <span className="text-zinc-400 text-sm">
          <span className="text-violet-400 mr-1.5">◆</span>
          {event.message}
        </span>
      </div>
    )
  }

  if (event.type === 'agent_started') {
    return (
      <div className="flex items-start gap-2.5 py-0.5 mt-1">
        {timeEl}
        <span className="text-sm">
          <span style={{ color: agentColor(agent || '') }} className="font-medium">[{agent}]</span>
          <span className="text-blue-400 ml-1.5">{event.message}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'agent_log') {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        {timeEl}
        <span className="text-sm">
          <span style={{ color: agentColor(agent || ''), opacity: 0.5 }}>[{agent}]</span>
          <span className="text-zinc-300 ml-1.5">{event.message}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'agent_completed') {
    const latency = event.latency_ms ? ` ${(event.latency_ms / 1000).toFixed(1)}s` : ''
    const cost = event.cost_usd ? ` · $${event.cost_usd.toFixed(4)}` : ''
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        {timeEl}
        <span className="text-sm">
          <span style={{ color: agentColor(agent || '') }} className="font-medium">[{agent}]</span>
          <span className="text-emerald-400 ml-1.5">✓ {event.message}</span>
          <span className="text-zinc-600 text-[11px] ml-1.5 tabular-nums">{latency}{cost}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'task_completed') {
    return (
      <div className="flex items-start gap-2.5 py-0.5 mt-2">
        {timeEl}
        <span className="text-emerald-400 text-sm font-medium">✓ {event.message}</span>
      </div>
    )
  }

  if (event.type === 'task_failed') {
    return (
      <div className="flex items-start gap-2.5 py-0.5">
        {timeEl}
        <span className="text-red-400 text-sm">✗ {event.message}</span>
      </div>
    )
  }

  return null
}
