interface CostBreakdownProps {
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

export default function CostBreakdown({
  totalCostUsd,
  totalTokens,
  executionTimeMs,
}: CostBreakdownProps) {
  const rows = [
    { agent: 'Total', model: '—', tokens: totalTokens, cost: totalCostUsd, bold: true },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-[#666] text-xs uppercase tracking-wider">Cost Breakdown</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left text-[#555] font-medium py-2 pr-4">Agent</th>
              <th className="text-left text-[#555] font-medium py-2 pr-4">Model</th>
              <th className="text-right text-[#555] font-medium py-2 pr-4">Tokens</th>
              <th className="text-right text-[#555] font-medium py-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#1f1f1f]">
                <td className={`py-2 pr-4 ${row.bold ? 'text-white font-semibold' : 'text-[#888]'}`}>
                  {row.agent}
                </td>
                <td className={`py-2 pr-4 ${row.bold ? 'text-white font-semibold' : 'text-[#888]'}`}>
                  {row.model}
                </td>
                <td className={`py-2 pr-4 text-right ${row.bold ? 'text-white font-semibold' : 'text-[#888]'}`}>
                  {fmtTokens(row.tokens)}
                </td>
                <td className={`py-2 text-right ${row.bold ? 'text-white font-semibold' : 'text-[#888]'}`}>
                  {fmt(row.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[#555] pt-1">
        <span>Execution time</span>
        <span className="text-[#666]">{(executionTimeMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  )
}
