'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProgressMetric } from '@/components/ui/progress-metric'
import { tgStatusClass } from '@/lib/status-styles'
import { formatRate, formatCpi } from '@/lib/utils'
import type { TargetGroup } from '@/types'

interface TGTableProps {
  projectId: string
  targetGroups?: TargetGroup[]
  isLoading: boolean
  isError: boolean
}

export function TGTable({
  projectId,
  targetGroups,
  isLoading,
  isError,
}: TGTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-border px-6 py-5">
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-red-600">
        Failed to load target groups.
      </p>
    )
  }

  if (!targetGroups?.length) {
    return (
      <div className="px-6 py-20 text-center">
        <h3 className="text-lg font-semibold text-[hsl(276,45%,28%)]">
          No target groups
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a target group to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_80px_100px_140px_80px_80px_40px] gap-4 border-b border-border bg-secondary/40 px-6 py-3">
        <span className="pp-label">Name</span>
        <span className="pp-label">Country</span>
        <span className="pp-label">Status</span>
        <span className="pp-label">Completes</span>
        <span className="pp-label">Conv.</span>
        <span className="pp-label">CPI</span>
        <span />
      </div>

      {targetGroups.map((tg) => (
        <div
          key={tg.id}
          role="button"
          tabIndex={0}
          className="pp-data-row grid grid-cols-[1fr_80px_100px_140px_80px_80px_40px] items-center gap-4 px-6"
          onClick={() =>
            router.push(`/projects/${projectId}/target-groups/${tg.id}`)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              router.push(`/projects/${projectId}/target-groups/${tg.id}`)
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">{tg.name}</p>
              <p className="text-xs text-muted-foreground">{tg.short_code}</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {tg.country_code ?? '—'}
          </span>
          <StatusBadge label={tg.status} className={tgStatusClass(tg.status)} />
          <ProgressMetric
            current={tg.stats?.completes_count ?? 0}
            target={tg.completes_goal}
          />
          <span className="text-sm font-medium">
            {formatRate(tg.stats?.conversion_rate)}
          </span>
          <span className="text-sm font-medium">{formatCpi(tg.base_cpi)}</span>
          <span />
        </div>
      ))}
    </div>
  )
}
