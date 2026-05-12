import AgentStatusRow, { type AgentStatus } from './AgentStatusRow'

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
  return (
    <div className="bg-[#111] border border-zinc-800 rounded-lg p-4 space-y-4 h-fit">
      {/* Agent list */}
      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Agents</p>
        <div className="divide-y divide-zinc-800/50">
          {agents.map((agent) => (
            <AgentStatusRow
              key={agent.name}
              name={agent.name}
              status={agent.status}
              latencyMs={agent.latencyMs}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Live stats */}
      <div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Live Stats</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500 text-xs font-mono">Tokens used</span>
            <span className="text-zinc-300 text-xs font-mono">
              {stats.tokens.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-xs font-mono">Cost so far</span>
            <span className="text-zinc-300 text-xs font-mono">
              ${stats.costUsd.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-xs font-mono">Elapsed</span>
            <span className="text-zinc-300 text-xs font-mono">
              {(stats.elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
