'use client'

import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TGBudgetSpendBarProps {
  spend: number
  cap: number
  currency?: string
}

export function TGBudgetSpendBar({ spend, cap, currency = 'SEK' }: TGBudgetSpendBarProps) {
  const pct = cap > 0 ? Math.min(100, Math.round((spend / cap) * 100)) : 0
  const atRisk = pct >= 90
  const over = spend >= cap

  return (
    <div
      className={cn(
        'mb-6 rounded-xl border bg-card p-4 shadow-card',
        over ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Budget spend
            </p>
            <p className="text-sm font-semibold text-foreground">
              {spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              /{' '}
              {cap.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              {currency}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            over || atRisk ? 'text-amber-400' : 'text-muted-foreground'
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            over ? 'bg-amber-500' : atRisk ? 'bg-amber-500/80' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function TGBudgetPausedBanner() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      role="alert"
    >
      <span className="mt-0.5 text-amber-400" aria-hidden>
        ⚠
      </span>
      <div>
        <p className="text-sm font-semibold text-amber-200">
          Budget cap reached — paused
        </p>
        <p className="mt-0.5 text-xs text-amber-200/80">
          This target group was paused automatically because spend reached the budget cap.
          Increase the cap or resume manually after review.
        </p>
      </div>
    </div>
  )
}

export function calculateBudgetSpend(
  completesCount: number,
  baseCpi?: string | null
): number {
  const cpi = baseCpi ? parseFloat(baseCpi) : NaN
  if (!Number.isFinite(cpi) || cpi < 0) return 0
  return completesCount * cpi
}
