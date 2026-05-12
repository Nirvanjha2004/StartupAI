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

function agentColor(agent: string): string {
  const colors: Record<string, string> = {
    planner: '#a78bfa',    // violet
    researcher: '#60a5fa', // blue
    enricher: '#34d399',   // emerald
    writer: '#f59e0b',     // amber
    critic: '#f472b6',     // pink
  }
  return colors[agent.toLowerCase()] || '#71717a'
}

export default function TerminalLine({ event }: TerminalLineProps) {
  const time = formatTime(event.timestamp)
  const agent = event.agent

  // Color by event type
  if (event.type === 'task_started') {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="text-zinc-400 font-mono text-sm">▶ {event.message}</span>
      </div>
    )
  }

  if (event.type === 'plan_ready') {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="text-zinc-400 font-mono text-sm">◆ {event.message}</span>
      </div>
    )
  }

  if (event.type === 'agent_started') {
    return (
      <div className="flex items-start gap-2 py-0.5 mt-1">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="font-mono text-sm">
          <span style={{ color: agentColor(agent || '') }}>[{agent}]</span>
          <span className="text-blue-400"> {event.message}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'agent_log') {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="font-mono text-sm">
          <span style={{ color: agentColor(agent || '') }} className="opacity-60">[{agent}]</span>
          <span className="text-zinc-200"> {event.message}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'agent_completed') {
    const latency = event.latency_ms ? ` ${(event.latency_ms / 1000).toFixed(1)}s` : ''
    const cost = event.cost_usd ? ` $${event.cost_usd.toFixed(4)}` : ''
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="font-mono text-sm">
          <span style={{ color: agentColor(agent || '') }}>[{agent}]</span>
          <span className="text-green-400"> ✓ {event.message}</span>
          <span className="text-zinc-600 text-xs">{latency}{cost}</span>
        </span>
      </div>
    )
  }

  if (event.type === 'task_completed') {
    return (
      <div className="flex items-start gap-2 py-0.5 mt-2">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="text-green-400 font-mono text-sm font-medium">✓ {event.message}</span>
      </div>
    )
  }

  if (event.type === 'task_failed') {
    return (
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-zinc-600 text-xs shrink-0 font-mono">{time}</span>
        <span className="text-red-400 font-mono text-sm">✗ {event.message}</span>
      </div>
    )
  }

  return null
}
