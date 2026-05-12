import AgentStatusRow, { type AgentStatus } from './AgentStatusRow'
import { Cpu, Coins, Timer } from 'lucide-react'

export interface AgentState {
  name: string
  status: AgentStatus
  latencyMs?: number
}

interface LiveStats {
  tokens: number
  costUsd: number
  elapsedMs: number
}

interface AgentStatusPanelProps {
  agents: AgentState[]
  stats: LiveStats
}

export default function AgentStatusPanel({ agents, stats }: AgentStatusPanelProps) {
  const doneCount = agents.filter((a) => a.status === 'done').length
  const totalCount = agents.length
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  return (
    <div className="surface-card p-4 space-y-5 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-medium">Agents</p>
        <span className="text-zinc-600 text-xs font-mono">{doneCount}/{totalCount}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden -mt-2">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Agent list */}
      <div className="divide-y divide-white/[0.04]">
        {agents.map((agent) => (
          <AgentStatusRow
            key={agent.name}
            name={agent.name}
            status={agent.status}
            latencyMs={agent.latencyMs}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Live stats */}
      <div className="space-y-1">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-medium mb-3">Live Stats</p>

        <div className="flex items-center justify-between py-1.5">
          <span className="flex items-center gap-2 text-zinc-600 text-xs">
            <Cpu className="w-3 h-3" />
            Tokens
          </span>
          <span className="text-zinc-300 text-xs font-mono tabular-nums">
            {stats.tokens.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="flex items-center gap-2 text-zinc-600 text-xs">
            <Coins className="w-3 h-3" />
            Cost
          </span>
          <span className="text-zinc-300 text-xs font-mono tabular-nums">
            ${stats.costUsd.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="flex items-center gap-2 text-zinc-600 text-xs">
            <Timer className="w-3 h-3" />
            Elapsed
          </span>
          <span className="text-zinc-300 text-xs font-mono tabular-nums">
            {(stats.elapsedMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  )
}
