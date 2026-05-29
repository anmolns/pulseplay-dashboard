'use client'

import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatChangeType, formatDateTime } from '@/lib/utils'
import type { ChangelogEntry } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

interface TGChangelogTabProps {
  projectId: string
  tgId: string
}

export function TGChangelogTab({ projectId, tgId }: TGChangelogTabProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.changelog(projectId, tgId),
    queryFn: async () => {
      const { data } = await api.get<ChangelogEntry[]>(
        `/projects/${projectId}/target-groups/${tgId}/changelog`
      )
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Failed to load changelog.
      </p>
    )
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <History className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 font-medium text-foreground">No changes yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits to settings and pricing will appear here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">
          {data.length} change{data.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="relative space-y-0 pl-2">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
        {data.map((entry) => (
          <div
            key={entry.id}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <span
              className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-card bg-primary ring-2 ring-primary/20"
              aria-hidden
            />
            <div className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/20 px-4 py-3 transition-colors hover:border-primary/20">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-foreground">
                  {formatChangeType(entry.change_type)}
                </p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </time>
              </div>
              {(entry.previous_value || entry.new_value) && (
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                  <span className="text-red-400/90">{entry.previous_value ?? '—'}</span>
                  <span className="mx-2 text-muted-foreground/50">→</span>
                  <span className="text-primary">{entry.new_value ?? '—'}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
