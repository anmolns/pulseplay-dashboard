'use client'

import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import type { FeasibilityResult } from '@/types'

const STATUS_CONFIG = {
  ok: {
    Icon: CheckCircle2,
    color: '#16A34A',
    label: 'Feasibility',
  },
  low: {
    Icon: AlertTriangle,
    color: '#D97706',
    label: 'Feasibility · Low',
  },
  at_risk: {
    Icon: XCircle,
    color: '#DC2626',
    label: 'Feasibility · At risk',
  },
} as const

function buildTooltip(d: FeasibilityResult): string {
  const base = `Base population: ${d.base_population.toLocaleString()} respondents in ${d.country_code} × IR ${d.applied_ir_pct}% × ${d.profiles_applied} profile dimensions`
  if (d.status === 'at_risk') {
    return `${base}\nConsider increasing IR, reducing completes goal, or removing profiling conditions.`
  }
  return base
}

interface FeasibilityBadgeProps {
  data?: FeasibilityResult | null
  isLoading?: boolean
}

export function FeasibilityBadge({ data, isLoading }: FeasibilityBadgeProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="pp-label">Feasibility</p>
            <div className="mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.status === 'unknown') {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="pp-label italic">Feasibility · Set a goal</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-muted-foreground">—</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <span className="text-base font-bold">?</span>
          </div>
        </div>
      </div>
    )
  }

  const { Icon, color, label } = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG]

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors"
      title={buildTooltip(data)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="pp-label" style={{ color }}>{label}</p>
          <p
            className="mt-1 truncate text-xl font-semibold tracking-tight"
            style={{ color }}
          >
            {data.feasible_count.toLocaleString()}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
