'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Download, Filter, Loader2, Users } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  QUALITY_FILTERS,
  countSpeeders,
  isFraudHoldSession,
  type QualityFilter,
} from '@/lib/session-tracking'
import { downloadSessionsCsv } from '@/lib/sessions-export'
import {
  formatDateTime,
  formatDuration,
  formatLabel,
  formatShortId,
} from '@/lib/utils'
import type { Session, SessionStatus } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { sessionStatusClass } from '@/lib/status-styles'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  SessionDetailDialog,
  SessionDeviceCell,
  SessionQualityBadge,
  SessionRespondentCell,
} from './SessionDetailDialog'

const STATUSES: (SessionStatus | 'all')[] = [
  'all',
  'started',
  'prescreened',
  'completed',
  'terminated',
  'quota_full',
  'dropped',
  'fraud_hold',
  'never_reached_client',
  'security_terminated',
]

interface TGSessionsTabProps {
  projectId: string
  tgId: string
}

export function TGSessionsTab({ projectId, tgId }: TGSessionsTabProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<string>('all')
  const [mode, setMode] = useState<string>('all')
  const [quality, setQuality] = useState<QualityFilter>('all')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [exporting, setExporting] = useState(false)

  const filters = useMemo(
    () => ({
      ...(status !== 'all' ? { status } : {}),
      ...(mode !== 'all' ? { mode } : {}),
      ...(quality !== 'all' ? { quality } : {}),
    }),
    [status, mode, quality]
  )

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.sessions(projectId, tgId, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (status !== 'all') params.set('status', status)
      if (mode !== 'all') params.set('mode', mode)
      if (quality !== 'all') params.set('quality', quality)
      const { data } = await api.get<Session[]>(
        `/projects/${projectId}/target-groups/${tgId}/sessions?${params}`
      )
      return data
    },
  })

  const sessions = useMemo(() => {
    if (!data) return data
    if (quality === 'all') return data
    return data.filter((s) => s.quality_flag?.toLowerCase() === quality)
  }, [data, quality])

  const speedersInView = countSpeeders(sessions)
  const hasActiveFilters = status !== 'all' || mode !== 'all' || quality !== 'all'

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      await downloadSessionsCsv(projectId, tgId, {
        status: 'completed',
        mode: mode !== 'all' ? mode : undefined,
      })
      toast({ title: 'Export started', description: 'Your CSV download should begin shortly.' })
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Could not download sessions',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Filter sessions</h3>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click a row for full device, quality, and respondent details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-border"
              disabled={exporting}
              onClick={handleExportCsv}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
            {sessions && (
              <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Users className="mr-1 inline h-3 w-3" />
                {sessions.length} shown
              </span>
            )}
            {speedersInView > 0 && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                {speedersInView} speeder{speedersInView !== 1 ? 's' : ''} in view
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FilterField label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
              <SelectTrigger className="h-10 w-full border-border bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Mode">
            <Select value={mode} onValueChange={(v) => setMode(v ?? 'all')}>
              <SelectTrigger className="h-10 w-full border-border bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Quality">
            <Select
              value={quality}
              onValueChange={(v) => setQuality((v ?? 'all') as QualityFilter)}
            >
              <SelectTrigger className="h-10 w-full border-border bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_FILTERS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q === 'all' ? 'All quality' : q.charAt(0).toUpperCase() + q.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="mt-3 text-xs font-medium text-primary hover:underline"
            onClick={() => {
              setStatus('all')
              setMode('all')
              setQuality('all')
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {[
                  'Session',
                  'Respondent',
                  'Device',
                  'Quality',
                  'Status',
                  'Timeline',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                      h === '' && 'w-10'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-400">
                    Failed to load sessions.
                  </td>
                </tr>
              )}
              {sessions?.map((session, idx) => {
                const fraudHold = isFraudHoldSession(session)
                return (
                <tr
                  key={session.id}
                  className={cn(
                    'cursor-pointer border-b border-border/60 transition-colors hover:bg-primary/5',
                    fraudHold && 'bg-red-500/10 hover:bg-red-500/15',
                    !fraudHold && idx % 2 === 1 && 'bg-secondary/20'
                  )}
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-xs text-foreground"
                      title={session.id}
                    >
                      {formatShortId(session.id, 10)}
                    </span>
                    <p className="mt-0.5 text-[10px] uppercase text-muted-foreground">
                      {session.mode}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <SessionRespondentCell session={session} />
                  </td>
                  <td className="px-4 py-3">
                    <SessionDeviceCell session={session} />
                  </td>
                  <td className="px-4 py-3">
                    <SessionQualityBadge
                      flag={session.quality_flag}
                      speedRatio={session.speed_ratio}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={session.status.replace(/_/g, ' ')}
                      className={sessionStatusClass(session.status)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">
                      {formatDateTime(session.started_at)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {session.completion_time_ms
                        ? formatDuration(session.completion_time_ms)
                        : session.completed_at
                          ? formatDateTime(session.completed_at)
                          : 'In progress'}
                      {session.completion_source
                        ? ` · ${formatLabel(session.completion_source)}`
                        : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              )})}
              {sessions?.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <p className="font-medium text-foreground">No sessions found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hasActiveFilters
                        ? 'Try clearing filters or check back after traffic starts.'
                        : 'Sessions appear when respondents enter the survey.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionDetailDialog
        session={selectedSession}
        open={selectedSession != null}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null)
        }}
      />
    </div>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
