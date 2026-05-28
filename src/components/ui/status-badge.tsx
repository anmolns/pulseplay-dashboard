import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  className: string
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        className
      )}
    >
      <span className="status-dot h-1.5 w-1.5 shrink-0 rounded-full" />
      {label}
    </span>
  )
}
