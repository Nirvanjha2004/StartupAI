import type { AgentDetail } from '@/types'

interface AgentBreakdownRowProps {
  agents: AgentDetail[]
  totalCostUsd: number
  totalTokens: number
  executionTimeMs: number
}

function fmt(n: number) {
  return `$${n.toFixed(4)}`
}

function fmtTokens(n: number) {
  return n.toLocaleString()
}

export default function AgentBreakdownRow({
  agents,
  totalCostUsd,
  totalTokens,
  executionTimeMs,
}: AgentBreakdownRowProps) {
  return (
    <div className="bg-[#111] border-t border-[#222] px-4 py-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#2a2a2a]">
            {['Agent', 'Model', 'In tokens', 'Out tokens', 'Cost', 'Latency', 'Status'].map((h) => (
              <th key={h} className="text-left text-[#444] font-medium py-2 pr-4 last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agent_name} className="border-b border-[#1a1a1a]">
              <td className="py-2 pr-4 text-[#aaa] capitalize">{agent.agent_name}</td>
              <td className="py-2 pr-4 text-[#666]">{agent.model_used}</td>
              <td className="py-2 pr-4 text-[#666]">{fmtTokens(agent.input_tokens)}</td>
              <td className="py-2 pr-4 text-[#666]">{fmtTokens(agent.output_tokens)}</td>
              <td className="py-2 pr-4 text-[#666]">{fmt(agent.estimated_cost_usd)}</td>
              <td className="py-2 pr-4 text-[#666]">
                {agent.latency_ms > 0 ? `${agent.latency_ms.toLocaleString()}ms` : '—'}
              </td>
              <td className="py-2">
                {agent.success ? (
                  <span className="text-[#22c55e]">✓</span>
                ) : (
                  <span className="text-[#ef4444]">✗</span>
                )}
              </td>
            </tr>
          ))}

          {/* Total row */}
          <tr className="border-t border-[#2a2a2a]">
            <td className="py-2 pr-4 text-white font-semibold" colSpan={2}>
              Total
            </td>
            <td className="py-2 pr-4 text-white font-semibold">
              {fmtTokens(agents.reduce((s, a) => s + a.input_tokens, 0))}
            </td>
            <td className="py-2 pr-4 text-white font-semibold">
              {fmtTokens(agents.reduce((s, a) => s + a.output_tokens, 0))}
            </td>
            <td className="py-2 pr-4 text-white font-semibold">{fmt(totalCostUsd)}</td>
            <td className="py-2 pr-4 text-white font-semibold">
              {(executionTimeMs / 1000).toFixed(1)}s
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
