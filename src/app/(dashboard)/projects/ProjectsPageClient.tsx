'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { FolderKanban, Layers, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { setStoredBusinessUnitId } from '@/hooks/useAuth'
import type { Project } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { Button } from '@/components/ui/button'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'
import { cn } from '@/lib/utils'

const NewProjectModal = dynamic(
  () =>
    import('@/components/projects/NewProjectModal').then((m) => m.NewProjectModal),
  { ssr: false }
)

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-card',
        highlight ? 'border-primary/25 bg-primary/5' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="pp-label">{label}</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold tracking-tight',
              highlight ? 'text-primary' : 'text-foreground'
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            highlight ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPageClient() {
  const [modalOpen, setModalOpen] = useState(false)
  const { set, clear } = useBreadcrumbs()

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects')
      return data
    },
  })

  const summary = useMemo(() => {
    const list = data ?? []
    const active = list.filter((p) => p.status === 'active').length
    const totalTgs = list.reduce((n, p) => n + (p.target_group_count ?? 0), 0)
    return { total: list.length, active, totalTgs }
  }, [data])

  useEffect(() => {
    if (data?.[0]?.business_unit_id) {
      setStoredBusinessUnitId(data[0].business_unit_id)
    }
  }, [data])

  useEffect(() => {
    set([{ label: 'Projects' }])
    return () => clear()
  }, [set, clear])

  return (
    <DashboardShell>
      <div className="pp-page">
        <PageHeader
          title="Projects"
          subtitle="Manage survey projects and target groups"
          actions={
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 bg-primary px-5 shadow-sm hover:bg-primary/90"
            >
              Create project
            </Button>
          }
        />

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <SummaryCard
              icon={FolderKanban}
              label="Total projects"
              value={String(summary.total)}
              sub={`${summary.active} active`}
              highlight
            />
            <SummaryCard
              icon={Layers}
              label="Target groups"
              value={String(summary.totalTgs)}
              sub="Across all projects"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Active rate"
              value={
                summary.total > 0
                  ? `${Math.round((summary.active / summary.total) * 100)}%`
                  : '—'
              }
              sub="Projects currently live"
            />
          </div>
        )}

        <ProjectTable projects={data} isLoading={isLoading} isError={isError} />

        <NewProjectModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          defaultBusinessUnitId={data?.[0]?.business_unit_id}
        />
      </div>
    </DashboardShell>
  )
}
