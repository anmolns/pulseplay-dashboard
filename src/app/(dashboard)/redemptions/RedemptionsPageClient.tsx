'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { normalizeRedemptionsPayload } from '@/lib/redemptions'
import { queryKeys } from '@/lib/query-keys'
import { useAuth } from '@/hooks/useAuth'
import type { Redemption, RedemptionStatus } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { RedemptionTable } from '@/components/redemptions/RedemptionTable'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const TABS: { status: RedemptionStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
]

export default function RedemptionsPageClient() {
  const router = useRouter()
  const { data: user, isLoading: authLoading } = useAuth()
  const [tab, setTab] = useState<RedemptionStatus>('pending')
  const { set, clear } = useBreadcrumbs()

  useEffect(() => {
    set([{ label: 'Redemptions' }])
    return () => clear()
  }, [set, clear])

  useEffect(() => {
    if (authLoading) return
    if (user && user.role !== 'admin') {
      router.replace('/projects')
    }
  }, [user, authLoading, router])

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.redemptions(tab),
    queryFn: async () => {
      const params = new URLSearchParams({ status: tab })
      const { data } = await api.get<unknown>(`/redemptions?${params}`)
      return normalizeRedemptionsPayload(data)
    },
    enabled: user?.role === 'admin',
  })

  if (authLoading || (user && user.role !== 'admin')) {
    return (
      <DashboardShell>
        <div className="pp-page">
          <Skeleton className="mb-6 h-12 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="pp-page">
        <PageHeader
          title="Redemptions"
          subtitle="Review and approve respondent reward requests"
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex border-b border-border">
            {TABS.map(({ status, label }) => (
              <button
                key={status}
                type="button"
                onClick={() => setTab(status)}
                className={cn(
                  'relative px-5 py-3.5 text-sm font-medium transition-colors',
                  tab === status
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {label}
                {tab === status && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
          <RedemptionTable
            redemptions={data}
            tabStatus={tab}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
