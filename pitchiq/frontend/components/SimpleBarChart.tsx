interface BarItem {
  label: string
  value: number
  displayValue: string
  color?: string
}

interface SimpleBarChartProps {
  title: string
  items: BarItem[]
  emptyMessage?: string
}

export default function SimpleBarChart({
  title,
  items,
  emptyMessage = 'No data yet',
}: SimpleBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 0.0001)

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
      <h3 className="text-[#666] text-xs uppercase tracking-wider">{title}</h3>

      {items.length === 0 || max === 0.0001 ? (
        <p className="text-[#444] text-sm">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-xs">{item.label}</span>
                <span className="text-[#666] text-xs">{item.displayValue}</span>
              </div>
              <div className="h-3 bg-[#222] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max((item.value / max) * 100, 2)}%`,
                    backgroundColor: item.color || '#22c55e',
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
