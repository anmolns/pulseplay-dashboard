import { cn } from '@/lib/utils'

interface ProgressMetricProps {
  label?: string
  current: number
  target?: number
  className?: string
}

export function ProgressMetric({
  label,
  current,
  target,
  className,
}: ProgressMetricProps) {
  const pct =
    target && target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className={cn('min-w-[140px]', className)}>
      {label && (
        <p className="pp-label mb-2 text-[10px]">{label}</p>
      )}
      <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-medium text-foreground">
        {current.toLocaleString()}
        {target != null && target > 0 && (
          <span className="font-normal text-muted-foreground">
            {' '}
            / {target.toLocaleString()}
          </span>
        )}
      </p>
    </div>
  )
}
