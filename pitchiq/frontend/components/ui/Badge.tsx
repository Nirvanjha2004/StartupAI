import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium' | 'outline'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default:  'bg-white/[0.06] text-zinc-400 border border-white/[0.08]',
  success:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning:  'bg-amber-500/10  text-amber-400  border border-amber-500/20',
  error:    'bg-red-500/10    text-red-400    border border-red-500/20',
  info:     'bg-blue-500/10   text-blue-400   border border-blue-500/20',
  premium:  'bg-amber-500/10  text-amber-400  border border-amber-500/25',
  outline:  'bg-transparent   text-zinc-500   border border-white/[0.08]',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[11px] rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-lg',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
