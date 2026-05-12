interface CostBreakdownProps {
  totalCostUsd: number
  totalTokens: number
  executionTimeMs: number
}

export default function CostBreakdown({
  totalCostUsd,
  totalTokens,
  executionTimeMs,
}: CostBreakdownProps) {
  const rows = [
    { label: 'Total tokens', value: totalTokens.toLocaleString() },
    { label: 'Total cost',   value: `$${totalCostUsd.toFixed(4)}` },
    { label: 'Exec time',    value: `${(executionTimeMs / 1000).toFixed(1)}s` },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Cost Breakdown</h3>
      <div className="space-y-1">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-zinc-500 text-xs">{label}</span>
            <span className="text-zinc-200 text-xs font-mono tabular-nums font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
