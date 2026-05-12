import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'green' | 'blue' | 'amber' | 'red' | 'default'
  className?: string
}

const accentMap = {
  green:   { icon: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  blue:    { icon: 'text-blue-400',    bg: 'bg-blue-500/10    border-blue-500/20'    },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10   border-amber-500/20'   },
  red:     { icon: 'text-red-400',     bg: 'bg-red-500/10     border-red-500/20'     },
  default: { icon: 'text-zinc-500',    bg: 'bg-white/[0.05]   border-white/[0.08]'   },
}

export default function StatsCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'default',
  className,
}: StatsCardProps) {
  const colors = accentMap[accent]

  return (
    <div className={cn('surface-card p-5 space-y-3 transition-all duration-200', className)}>
      <div className="flex items-center justify-between">
        <p className="text-zinc-500 text-[11px] uppercase tracking-widest font-medium">{label}</p>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center', colors.bg)}>
            <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
          </div>
        )}
      </div>
      <p className="text-white text-2xl font-bold tracking-tight leading-none">{value}</p>
      {sub && <p className="text-zinc-600 text-xs leading-relaxed">{sub}</p>}
    </div>
  )
}
