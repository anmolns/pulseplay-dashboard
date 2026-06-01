'use client'

import { AlertTriangle, BarChart3, ShieldAlert, Target, TrendingUp, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeasibilityResult } from '@/types'
import { FeasibilityBadge } from './FeasibilityBadge'

interface TGStatsBarProps {
  completes: number
  goal?: number
  conversion: string
  cpi: string
  incidence: string
  speederCount: number
  fraudCount: number
  feasibilityData?: FeasibilityResult | null
  feasibilityLoading?: boolean
}

export function TGStatsBar({
  completes,
  goal,
  conversion,
  cpi,
  incidence,
  speederCount,
  fraudCount,
  feasibilityData,
  feasibilityLoading,
}: TGStatsBarProps) {
  const completePct = goal && goal > 0 ? Math.min(100, Math.round((completes / goal) * 100)) : null

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <FeasibilityBadge data={feasibilityData} isLoading={feasibilityLoading} />
      <StatCard
        icon={Target}
        label="Completes"
        value={goal ? `${completes.toLocaleString()} / ${goal.toLocaleString()}` : completes.toLocaleString()}
        highlight
        sub={completePct != null ? `${completePct}% of goal` : undefined}
      />
      <StatCard icon={TrendingUp} label="Conversion" value={conversion} />
      <StatCard icon={Wallet} label="CPI" value={cpi} />
      <StatCard icon={BarChart3} label="Incidence" value={incidence} />
      <StatCard
        icon={AlertTriangle}
        label="Speeders"
        value={String(speederCount)}
        danger={speederCount > 0}
        sub={speederCount > 0 ? 'Review in Sessions' : 'No flags'}
      />
      <StatCard
        icon={ShieldAlert}
        label="Frauds"
        value={String(fraudCount)}
        danger={fraudCount > 0}
        sub={fraudCount > 0 ? 'fraud_hold sessions' : 'None held'}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  highlight?: boolean
  danger?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-card transition-colors',
        danger
          ? 'border-red-500/30 bg-red-500/5'
          : highlight
            ? 'border-primary/25 bg-primary/5'
            : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="pp-label">{label}</p>
          <p
            className={cn(
              'mt-1 truncate text-xl font-semibold tracking-tight',
              danger && 'text-red-400',
              highlight && !danger && 'text-primary',
              !danger && !highlight && 'text-foreground'
            )}
          >
            {value}
          </p>
          {sub && (
            <p
              className={cn(
                'mt-0.5 text-xs',
                danger ? 'text-red-400/80' : 'text-muted-foreground'
              )}
            >
              {sub}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            danger
              ? 'bg-red-500/15 text-red-400'
              : highlight
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
