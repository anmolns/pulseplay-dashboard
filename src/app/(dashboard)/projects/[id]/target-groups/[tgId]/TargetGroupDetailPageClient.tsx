'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { Project, TargetGroup, TGStatus } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/status-badge'
import { tgStatusClass } from '@/lib/status-styles'
import { formatCpi, formatRate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { TGOverviewTab } from '@/components/target-groups/TGOverviewTab'
import { TGProfilingTab } from '@/components/target-groups/TGProfilingTab'
import { TGSessionsTab } from '@/components/target-groups/TGSessionsTab'
import { TGChangelogTab } from '@/components/target-groups/TGChangelogTab'
import { useCpiCalc } from '@/components/pricing/CpiCalcContext'

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

  useEffect(() => {
    if (!tg) return
    setInputs({
      country_code: tg.country_code || undefined,
      loi_minutes: tg.expected_loi_minutes ?? undefined,
      ir_pct: tg.expected_ir_pct ?? undefined,
      completes_goal: tg.completes_goal ?? undefined,
    })
  }, [tg, setInputs])

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
              className="border-red-200 text-red-700 hover:bg-red-50"
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
              className="border-red-200 text-red-700 hover:bg-red-50"
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

  return (
    <DashboardShell>
      <div className="pp-page">
        {isLoading ? (
          <Skeleton className="mb-8 h-16 w-full" />
        ) : (
          <>
            <PageHeader
              breadcrumbs={[
                { label: 'Projects', href: '/projects' },
                { label: project?.name ?? '...', href: `/projects/${projectId}` },
                { label: tg?.name ?? '...' },
              ]}
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

            {tg && (
              <div className="mb-8 flex flex-wrap gap-8 border-b border-border pb-6">
                <Metric label="Completes" value={`${completes.toLocaleString()}${goal ? ` / ${goal}` : ''}`} highlight />
                <Metric label="Conversion" value={formatRate(tg.stats?.conversion_rate)} />
                <Metric label="CPI" value={formatCpi(tg.base_cpi)} />
                <Metric
                  label="Incidence"
                  value={formatRate(tg.stats?.incidence_rate_actual)}
                />
              </div>
            )}
          </>
        )}

        {tg && (
          <Tabs defaultValue="overview">
            <TabsList
              variant="line"
              className="mb-6 h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0"
            >
              {['overview', 'profiling', 'sessions', 'changelog'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent px-0 pb-3 capitalize shadow-none data-active:border-primary data-active:text-primary"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">
              <TGOverviewTab
                projectId={projectId}
                tgId={tgId}
                tg={tg}
                businessUnitId={project?.business_unit_id}
              />
            </TabsContent>
            <TabsContent value="profiling">
              <TGProfilingTab projectId={projectId} tgId={tgId} />
            </TabsContent>
            <TabsContent value="sessions">
              <TGSessionsTab projectId={projectId} tgId={tgId} />
            </TabsContent>
            <TabsContent value="changelog">
              <TGChangelogTab projectId={projectId} tgId={tgId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="pp-label mb-1">{label}</p>
      <p
        className={
          highlight
            ? 'text-lg font-semibold text-primary'
            : 'text-lg font-semibold text-foreground'
        }
      >
        {value}
      </p>
    </div>
  )
}
