'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatChangeType, formatDate } from '@/lib/utils'
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
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load changelog.</p>
  }

  return (
    <div className="relative ml-3 border-l border-slate-200 pl-6">
      {data?.map((entry) => (
        <div key={entry.id} className="relative mb-6 last:mb-0">
          <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 shadow" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-medium text-slate-900">
                {formatChangeType(entry.change_type)}
              </span>
              {(entry.previous_value || entry.new_value) && (
                <span className="ml-2 text-sm text-slate-600">
                  {entry.previous_value ?? '—'} → {entry.new_value ?? '—'}
                </span>
              )}
            </div>
            <span className="text-sm text-slate-500">
              {formatDate(entry.created_at)}
            </span>
          </div>
        </div>
      ))}
      {data?.length === 0 && (
        <p className="text-sm text-slate-500">No changelog entries yet.</p>
      )}
    </div>
  )
}
