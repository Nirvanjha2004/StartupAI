'use client'

import { motion } from 'framer-motion'

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
  const hasData = items.length > 0 && max > 0.0001

  return (
    <div className="surface-card p-5 space-y-4">
      <h3 className="text-zinc-500 text-[11px] uppercase tracking-widest font-medium">{title}</h3>

      {!hasData ? (
        <div className="py-6 text-center">
          <p className="text-zinc-700 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs">{item.label}</span>
                <span className="text-zinc-500 text-xs font-mono tabular-nums">{item.displayValue}</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  style={{ backgroundColor: item.color || '#22c55e', opacity: 0.75 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
