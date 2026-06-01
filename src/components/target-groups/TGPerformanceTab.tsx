'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileBarChart } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { SessionSummaryRow } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  completed: 'Complete',
  terminated: 'Term',
  quota_full: 'Quota Full',
  never_reached_client: 'Never Reached Client',
  fraud_hold: 'Fraud Hold',
  dropped: 'Dropout',
  started: 'Started',
  prescreened: 'Prescreened',
  security_terminated: 'Security Term',
}

interface StatusPillProps {
  status: string
}

function StatusPill({ status }: StatusPillProps) {
  const label = STATUS_LABEL[status] ?? status.replace(/_/g, ' ')

  const styles: Record<string, string> = {
    completed: 'bg-[#16A34A] text-white',
    terminated: 'border border-[#DC2626] text-[#DC2626] bg-transparent',
    quota_full: 'border border-[#6B7280] text-[#6B7280] bg-transparent',
    never_reached_client: 'border border-[#EA580C] text-[#EA580C] bg-transparent',
    fraud_hold: 'border border-[#D97706] text-[#D97706] bg-transparent',
    dropped: 'border border-[#64748B] text-[#64748B] bg-transparent',
    started: 'bg-[#9CA3AF]/20 text-[#9CA3AF]',
    prescreened: 'border border-[#2563EB] text-[#2563EB] bg-transparent',
    security_terminated: 'border border-[#991B1B] text-[#991B1B] bg-transparent',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        styles[status] ?? 'border border-border text-muted-foreground bg-transparent'
      )}
    >
      {label}
    </span>
  )
}

interface TGPerformanceTabProps {
  projectId: string
  tgId: string
}

export function TGPerformanceTab({ projectId, tgId }: TGPerformanceTabProps) {
  const [mode, setMode] = useState<'live' | 'test'>('live')

  const { data: rows, isLoading, isError } = useQuery({
    queryKey: queryKeys.sessionSummary(projectId, tgId, mode),
    queryFn: async () => {
      const { data } = await api.get<SessionSummaryRow[]>(
        `/projects/${projectId}/target-groups/${tgId}/sessions/summary?mode=${mode}`
      )
      return data
    },
  })

  const total = rows?.reduce((sum, r) => sum + r.count, 0) ?? 0

  const modeTab = (value: 'live' | 'test', label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium transition-colors',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-opacity',
        mode === value
          ? 'text-primary after:bg-primary after:opacity-100'
          : 'text-muted-foreground hover:text-foreground after:opacity-0'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Respondent Analysis section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Respondent Analysis</p>
            <p className="text-xs text-muted-foreground">
              Session outcomes for this target group
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border text-xs">
            <FileBarChart className="h-3.5 w-3.5" />
            Get full report
          </Button>
        </div>

        {/* Live / Test tab toggle */}
        <div className="flex gap-1 border-b border-border px-2">
          {modeTab('live', 'Live')}
          {modeTab('test', 'Test')}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-5 py-3">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </td>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-10" />
                    </td>
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-red-400">
                    Failed to load respondent analysis.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows?.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 text-center text-sm text-muted-foreground"
                    style={{ height: 80 }}
                  >
                    No sessions recorded yet.
                  </td>
                </tr>
              )}

              {rows?.map((row, idx) => (
                <tr
                  key={`${row.status}-${idx}`}
                  className={cn(
                    'border-b border-border/60',
                    idx % 2 === 1 && 'bg-secondary/20'
                  )}
                >
                  <td className="px-5 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-5 py-3">
                    {row.reason_label ? (
                      <>
                        <p className="text-sm text-foreground">{row.reason_label}</p>
                        <p className="mt-0.5 text-[11px] italic text-muted-foreground">
                          {row.description}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-foreground">{row.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-foreground">
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Total row */}
            {rows && rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-secondary/30">
                  <td className="px-5 py-3 text-sm font-semibold text-foreground">Total</td>
                  <td className="px-5 py-3 text-muted-foreground">—</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-foreground">
                    {total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
