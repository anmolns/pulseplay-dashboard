'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { FeasibilityResult, Project, Session, TargetGroup, TGProfile } from '@/types'
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
import { TGPerformanceTab } from '@/components/target-groups/TGPerformanceTab'
import { TGStatsBar } from '@/components/target-groups/TGStatsBar'
import { TGTabNav } from '@/components/target-groups/TGTabNav'
import { TGStatusControl } from '@/components/target-groups/TGStatusControl'
import { countFraudHolds, countSpeeders } from '@/lib/session-tracking'
import {
  TGBudgetPausedBanner,
  TGBudgetSpendBar,
  calculateBudgetSpend,
} from '@/components/target-groups/TGBudgetSpendBar'
import { useCpiCalc } from '@/components/pricing/CpiCalcContext'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export default function TargetGroupDetailPageClient({
  projectId,
  tgId,
}: {
  projectId: string
  tgId: string
}) {
  const { setInputs } = useCpiCalc()
  const { set, clear } = useBreadcrumbs()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      api.patch<TargetGroup>(`/projects/${projectId}/target-groups/${tgId}`, {
        status: 'draft',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroups(projectId) })
      toast({ title: 'Saved as draft' })
    },
    onError: (e: Error) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

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

  // Profiles count — needed for feasibility trigger
  const { data: profiles } = useQuery({
    queryKey: queryKeys.profiles(projectId, tgId),
    queryFn: async () => {
      const { data } = await api.get<TGProfile[]>(
        `/projects/${projectId}/target-groups/${tgId}/profiles`
      )
      return data
    },
    enabled: !!tg,
    staleTime: 30_000,
  })

  // Feasibility inputs — debounced 800ms
  const profilesCount = profiles?.length ?? 0
  const feasibilityInputs = {
    country_code: tg?.country_code ?? null,
    ir_pct: tg?.expected_ir_pct ?? null,
    completes_goal: tg?.completes_goal ?? null,
    profiles_count: profilesCount,
  }
  const debouncedFeasInputs = useDebouncedValue(feasibilityInputs, 800)

  const hasGoal = (debouncedFeasInputs.completes_goal ?? 0) > 0

  const { data: feasibility, isFetching: feasibilityLoading } = useQuery({
    queryKey: [
      ...queryKeys.feasibility(projectId, tgId),
      debouncedFeasInputs,
    ],
    queryFn: async () => {
      const { data } = await api.get<FeasibilityResult>(
        `/projects/${projectId}/target-groups/${tgId}/feasibility`
      )
      return data
    },
    enabled: !!tg && hasGoal,
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

  const completes = tg?.stats?.completes_count ?? 0
  const goal = tg?.completes_goal ?? 0
  const speederCount = countSpeeders(speederSessions)
  const fraudCount = countFraudHolds(fraudSessions)
  const budgetCapNum = tg?.budget_cap ? parseFloat(tg.budget_cap) : NaN
  const hasBudgetCap = Number.isFinite(budgetCapNum) && budgetCapNum > 0
  const budgetSpend = calculateBudgetSpend(completes, tg?.base_cpi)
  const showBudgetPausedBanner =
    tg?.status === 'paused' && hasBudgetCap && budgetSpend >= budgetCapNum

  // Feasibility state is unknown if no goal set or query hasn't returned yet
  const effectiveFeasibility = hasGoal ? feasibility : null

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
                tg ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={saveDraftMutation.isPending}
                      onClick={() => saveDraftMutation.mutate()}
                    >
                      {saveDraftMutation.isPending ? 'Saving…' : 'Save draft'}
                    </Button>
                    <TGStatusControl
                      projectId={projectId}
                      tgId={tgId}
                      tg={tg}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={saveDraftMutation.isPending}
                      onClick={() => saveDraftMutation.mutate()}
                    >
                      {saveDraftMutation.isPending ? 'Saving…' : 'Save draft'}
                    </Button>
                  </div>
                )
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
                feasibilityData={effectiveFeasibility}
                feasibilityLoading={feasibilityLoading && hasGoal}
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
                <TabsContent value="performance" className="mt-0">
                  <TGPerformanceTab projectId={projectId} tgId={tgId} />
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
