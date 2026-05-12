import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton rounded-lg', className)} />
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="surface-card p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04]">
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-14" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}
