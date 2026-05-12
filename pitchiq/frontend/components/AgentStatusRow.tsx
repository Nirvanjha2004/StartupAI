export type AgentStatus = 'waiting' | 'running' | 'done' | 'failed'

interface AgentStatusRowProps {
  name: string
  status: AgentStatus
  latencyMs?: number
}

const AGENT_COLORS: Record<string, string> = {
  planner:    '#a78bfa',
  researcher: '#60a5fa',
  enricher:   '#34d399',
  writer:     '#f59e0b',
  critic:     '#f472b6',
}

export default function AgentStatusRow({ name, status, latencyMs }: AgentStatusRowProps) {
  const color = AGENT_COLORS[name.toLowerCase()] || '#71717a'

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        {/* Status dot */}
        {status === 'waiting' && (
          <span className="w-2 h-2 rounded-full border border-zinc-700 shrink-0" />
        )}
        {status === 'running' && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
        )}
        {status === 'done' && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        )}
        {status === 'failed' && (
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
        )}

        <span
          className="text-xs font-medium capitalize"
          style={{
            color: status === 'waiting' ? '#52525b'
                 : status === 'running' ? '#60a5fa'
                 : status === 'failed'  ? '#f87171'
                 : color,
          }}
        >
          {name}
        </span>
      </div>

      <span className="text-[11px] font-mono tabular-nums">
        {status === 'waiting' && <span className="text-zinc-700">—</span>}
        {status === 'running' && (
          <span className="text-blue-400 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
            running
          </span>
        )}
        {status === 'done' && (
          <span className="text-zinc-500">
            {latencyMs ? `${(latencyMs / 1000).toFixed(1)}s` : '✓'}
          </span>
        )}
        {status === 'failed' && <span className="text-red-400">failed</span>}
      </span>
    </div>
  )
}
