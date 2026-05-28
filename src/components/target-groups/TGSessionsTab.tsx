'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatDate, formatDuration } from '@/lib/utils'
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
            <TableHead>Respondent ID</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {isError && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-red-600">
                Failed to load sessions.
              </TableCell>
            </TableRow>
          )}
          {data?.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-mono text-sm">
                {session.respondent_id ?? '—'}
              </TableCell>
              <TableCell className="capitalize">{session.mode}</TableCell>
              <TableCell>
                <StatusBadge
                  label={session.status.replace(/_/g, ' ')}
                  className={sessionStatusClass(session.status)}
                />
              </TableCell>
              <TableCell>{formatDate(session.started_at)}</TableCell>
              <TableCell>{formatDuration(session.completion_time_ms)}</TableCell>
            </TableRow>
          ))}
          {data?.length === 0 && !isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                No sessions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
