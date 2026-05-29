'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { Project, Session, TargetGroup, TGStatus } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/status-badge'
import { tgStatusClass } from '@/lib/status-styles'
import { formatCpi, formatRate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TGOverviewTab } from '@/components/target-groups/TGOverviewTab'
import { TGProfilingTab } from '@/components/target-groups/TGProfilingTab'
import { TGSessionsTab } from '@/components/target-groups/TGSessionsTab'
import { TGChangelogTab } from '@/components/target-groups/TGChangelogTab'
import { TGStatsBar } from '@/components/target-groups/TGStatsBar'
import { TGTabNav } from '@/components/target-groups/TGTabNav'
import { countFraudHolds, countSpeeders } from '@/lib/session-tracking'
import {
  TGBudgetPausedBanner,
  TGBudgetSpendBar,
  calculateBudgetSpend,
} from '@/components/target-groups/TGBudgetSpendBar'
import { useCpiCalc } from '@/components/pricing/CpiCalcContext'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'

export default function TargetGroupDetailPageClient({
  projectId,
  tgId,
}: {
  projectId: string
  tgId: string
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { setInputs } = useCpiCalc()
  const { set, clear } = useBreadcrumbs()

  const { data: project } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${projectId}`)
      return data
    },
  })

  const { data: tg, isLoading } = useQuery({
    queryKey: queryKeys.targetGroup(projectId, tgId),
    queryFn: async () => {
      const { data } = await api.get<TargetGroup>(
        `/projects/${projectId}/target-groups/${tgId}`
      )
      return data
    },
  })

  const { data: speederSessions } = useQuery({
    queryKey: queryKeys.sessions(projectId, tgId, { quality: 'speeder' }),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '200', offset: '0', quality: 'speeder' })
      const { data } = await api.get<Session[]>(
        `/projects/${projectId}/target-groups/${tgId}/sessions?${params}`
      )
      return data
    },
    enabled: !!tg,
    staleTime: 30_000,
  })

  const { data: fraudSessions } = useQuery({
    queryKey: queryKeys.sessions(projectId, tgId, { status: 'fraud_hold' }),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '200',
        offset: '0',
        status: 'fraud_hold',
      })
      const { data } = await api.get<Session[]>(
        `/projects/${projectId}/target-groups/${tgId}/sessions?${params}`
      )
      return data
    },
    enabled: !!tg,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!tg) return
    setInputs({
      country_code: tg.country_code || undefined,
      loi_minutes: tg.expected_loi_minutes ?? undefined,
      ir_pct: tg.expected_ir_pct ?? undefined,
      completes_goal: tg.completes_goal ?? undefined,
    })
  }, [tg, setInputs])

  useEffect(() => {
    set([
      { label: 'Projects', href: '/projects' },
      { label: project?.name ?? '...', href: `/projects/${projectId}` },
      { label: tg?.name ?? '...' },
    ])
    return () => clear()
  }, [set, clear, projectId, project?.name, tg?.name])

  const statusMutation = useMutation({
    mutationFn: async (status: TGStatus) => {
      const { data } = await api.patch<TargetGroup>(
        `/projects/${projectId}/target-groups/${tgId}`,
        { status }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetGroup(projectId, tgId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetGroups(projectId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.changelog(projectId, tgId),
      })
      toast({ title: 'Status updated' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const renderActions = () => {
    if (!tg) return null
    switch (tg.status) {
      case 'draft':
        return (
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => statusMutation.mutate('live')}
          >
            Launch
          </Button>
        )
      case 'live':
        return (
          <>
            <Button variant="outline" onClick={() => statusMutation.mutate('paused')}>
              Pause
            </Button>
            <Button
              variant="outline"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              onClick={() => statusMutation.mutate('closed')}
            >
              Close
            </Button>
          </>
        )
      case 'paused':
        return (
          <>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => statusMutation.mutate('live')}
            >
              Resume
            </Button>
            <Button
              variant="outline"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              onClick={() => statusMutation.mutate('closed')}
            >
              Close
            </Button>
          </>
        )
      default:
        return null
    }
  }

  const completes = tg?.stats?.completes_count ?? 0
  const goal = tg?.completes_goal ?? 0
  const speederCount = countSpeeders(speederSessions)
  const fraudCount = countFraudHolds(fraudSessions)
  const budgetCapNum = tg?.budget_cap ? parseFloat(tg.budget_cap) : NaN
  const hasBudgetCap = Number.isFinite(budgetCapNum) && budgetCapNum > 0
  const budgetSpend = calculateBudgetSpend(completes, tg?.base_cpi)
  const showBudgetPausedBanner =
    tg?.status === 'paused' && hasBudgetCap && budgetSpend >= budgetCapNum

  return (
    <DashboardShell>
      <div className="pp-page">
        {isLoading ? (
          <Skeleton className="mb-8 h-16 w-full" />
        ) : (
          <>
            <PageHeader
              title={tg?.name ?? ''}
              subtitle={tg?.short_code}
              badge={
                tg ? (
                  <StatusBadge label={tg.status} className={tgStatusClass(tg.status)} />
                ) : undefined
              }
              actions={
                <div className="flex gap-2">
                  <Button variant="outline">Save draft</Button>
                  {renderActions()}
                </div>
              }
            />

            {showBudgetPausedBanner && <TGBudgetPausedBanner />}

            {tg && hasBudgetCap && (
              <TGBudgetSpendBar spend={budgetSpend} cap={budgetCapNum} />
            )}

            {tg && (
              <TGStatsBar
                completes={completes}
                goal={goal}
                conversion={formatRate(tg.stats?.conversion_rate)}
                cpi={formatCpi(tg.base_cpi)}
                incidence={formatRate(tg.stats?.incidence_rate_actual)}
                speederCount={speederCount}
                fraudCount={fraudCount}
              />
            )}
          </>
        )}

        {tg && (
          <Tabs defaultValue="overview" className="space-y-0">
            <div className="rounded-xl border border-border bg-card shadow-card">
              <TGTabNav />
              <div className="p-6">
            <TabsContent value="overview" className="mt-0">
              <TGOverviewTab
                projectId={projectId}
                tgId={tgId}
                tg={tg}
                businessUnitId={project?.business_unit_id}
              />
            </TabsContent>
            <TabsContent value="profiling" className="mt-0">
              <TGProfilingTab projectId={projectId} tgId={tgId} />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0">
              <TGSessionsTab projectId={projectId} tgId={tgId} />
            </TabsContent>
            <TabsContent value="changelog" className="mt-0">
              <TGChangelogTab projectId={projectId} tgId={tgId} />
            </TabsContent>
              </div>
            </div>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  )
}
