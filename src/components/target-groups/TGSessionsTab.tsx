'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  formatDateTime,
  formatDuration,
  formatLabel,
  formatShortId,
} from '@/lib/utils'
import type { Session, SessionStatus } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

const COL_COUNT = 9

interface TGSessionsTabProps {
  projectId: string
  tgId: string
}

export function TGSessionsTab({ projectId, tgId }: TGSessionsTabProps) {
  const [status, setStatus] = useState<string>('all')
  const [mode, setMode] = useState<string>('all')

  const filters = {
    ...(status !== 'all' ? { status } : {}),
    ...(mode !== 'all' ? { mode } : {}),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.sessions(projectId, tgId, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (status !== 'all') params.set('status', status)
      if (mode !== 'all') params.set('mode', mode)
      const { data } = await api.get<Session[]>(
        `/projects/${projectId}/target-groups/${tgId}/sessions?${params}`
      )
      return data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          <span className="font-medium text-foreground">Respondent ID</span> is only
          stored when you pass{' '}
          <code className="rounded bg-background px-1 py-0.5 text-xs text-foreground">
            respondent_id
          </code>{' '}
          in{' '}
          <code className="rounded bg-background px-1 py-0.5 text-xs text-foreground">
            POST /track/session
          </code>{' '}
          or in the S2S webhook body on completion. Browser redirect callbacks
          (complete / terminate) do not add a panelist ID by themselves — use the
          session token in the <span className="font-medium text-foreground">Session</span>{' '}
          column to match rows until then.
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={mode} onValueChange={(v) => setMode(v ?? 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modes</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Respondent ID</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: COL_COUNT }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {isError && (
            <TableRow>
              <TableCell
                colSpan={COL_COUNT}
                className="text-center text-red-400"
              >
                Failed to load sessions.
              </TableCell>
            </TableRow>
          )}
          {data?.map((session) => (
            <TableRow key={session.id}>
              <TableCell
                className="font-mono text-xs text-foreground"
                title={session.id}
              >
                {formatShortId(session.id)}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {session.respondent_id ? (
                  <span className="font-mono">{session.respondent_id}</span>
                ) : (
                  <span className="text-muted-foreground">Not assigned</span>
                )}
              </TableCell>
              <TableCell className="capitalize text-foreground">
                {session.mode}
              </TableCell>
              <TableCell>
                <StatusBadge
                  label={session.status.replace(/_/g, ' ')}
                  className={sessionStatusClass(session.status)}
                />
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {formatLabel(session.completion_source)}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {formatDateTime(session.started_at)}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {formatDateTime(session.completed_at)}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {formatDuration(session.completion_time_ms)}
              </TableCell>
              <TableCell
                className="max-w-[160px] truncate text-sm text-muted-foreground"
                title={session.reason_label}
              >
                {session.reason_label ?? '—'}
              </TableCell>
            </TableRow>
          ))}
          {data?.length === 0 && !isLoading && (
            <TableRow>
              <TableCell
                colSpan={COL_COUNT}
                className="py-8 text-center text-muted-foreground"
              >
                No sessions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
