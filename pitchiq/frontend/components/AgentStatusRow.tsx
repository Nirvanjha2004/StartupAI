export type AgentStatus = 'waiting' | 'running' | 'done' | 'failed'

interface AgentStatusRowProps {
  name: string
  status: AgentStatus
  latencyMs?: number
}

export default function AgentStatusRow({ name, status, latencyMs }: AgentStatusRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5">
        {status === 'waiting' && (
          <span className="w-2 h-2 rounded-full border border-zinc-600" />
        )}
        {status === 'running' && (
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
        {status === 'done' && (
          <span className="w-2 h-2 rounded-full bg-green-400" />
        )}
        {status === 'failed' && (
          <span className="w-2 h-2 rounded-full bg-red-400" />
        )}
        <span className={`text-sm capitalize font-mono ${
          status === 'running' ? 'text-blue-400' :
          status === 'done'    ? 'text-zinc-300' :
          status === 'failed'  ? 'text-red-400'  :
          'text-zinc-500'
        }`}>
          {name}
        </span>
      </div>

      <span className="text-xs font-mono">
        {status === 'waiting' && <span className="text-zinc-600">waiting</span>}
        {status === 'running' && <span className="text-blue-400">running</span>}
        {status === 'done' && (
          <span className="text-zinc-500">
            {latencyMs ? `✓ ${(latencyMs / 1000).toFixed(1)}s` : '✓'}
          </span>
        )}
        {status === 'failed' && <span className="text-red-400">failed</span>}
      </span>
    </div>
  )
}
