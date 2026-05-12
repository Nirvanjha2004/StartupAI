import type { AgentDetail } from '@/types'
import { CheckCircle2, XCircle } from 'lucide-react'

interface AgentBreakdownRowProps {
  agents: AgentDetail[]
  totalCostUsd: number
  totalTokens: number
  executionTimeMs: number
}

const AGENT_COLORS: Record<string, string> = {
  planner:    '#a78bfa',
  researcher: '#60a5fa',
  enricher:   '#34d399',
  writer:     '#f59e0b',
  critic:     '#f472b6',
}

export default function AgentBreakdownRow({
  agents,
  totalCostUsd,
  totalTokens,
  executionTimeMs,
}: AgentBreakdownRowProps) {
  return (
    <div className="bg-[#0d0d0d] border-t border-white/[0.04] px-4 py-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Agent', 'Model', 'In', 'Out', 'Cost', 'Latency', ''].map((h) => (
                <th key={h} className="text-left text-zinc-600 font-medium py-2 pr-4 last:pr-0 uppercase tracking-wider text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const color = AGENT_COLORS[agent.agent_name.toLowerCase()] || '#71717a'
              return (
                <tr key={agent.agent_name} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 font-medium capitalize" style={{ color }}>
                    {agent.agent_name}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-600 font-mono">{agent.model_used}</td>
                  <td className="py-2.5 pr-4 text-zinc-500 tabular-nums">{agent.input_tokens.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-zinc-500 tabular-nums">{agent.output_tokens.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-zinc-500 font-mono tabular-nums">${agent.estimated_cost_usd.toFixed(4)}</td>
                  <td className="py-2.5 pr-4 text-zinc-500 tabular-nums">
                    {agent.latency_ms > 0 ? `${(agent.latency_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-2.5">
                    {agent.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-500" />
                    }
                  </td>
                </tr>
              )
            })}

            {/* Total row */}
            <tr className="border-t border-white/[0.08]">
              <td className="py-2.5 pr-4 text-zinc-200 font-semibold" colSpan={2}>Total</td>
              <td className="py-2.5 pr-4 text-zinc-300 font-semibold tabular-nums">
                {agents.reduce((s, a) => s + a.input_tokens, 0).toLocaleString()}
              </td>
              <td className="py-2.5 pr-4 text-zinc-300 font-semibold tabular-nums">
                {agents.reduce((s, a) => s + a.output_tokens, 0).toLocaleString()}
              </td>
              <td className="py-2.5 pr-4 text-zinc-300 font-semibold font-mono tabular-nums">
                ${totalCostUsd.toFixed(4)}
              </td>
              <td className="py-2.5 pr-4 text-zinc-300 font-semibold tabular-nums">
                {(executionTimeMs / 1000).toFixed(1)}s
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
