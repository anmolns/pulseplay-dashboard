'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { setStoredBusinessUnitId } from '@/hooks/useAuth'
import type { Project, TargetGroup } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { TGTable } from '@/components/target-groups/TGTable'
import { StatusBadge } from '@/components/ui/status-badge'
import { projectStatusClass } from '@/lib/status-styles'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'

const NewTGModal = dynamic(
  () => import('@/components/target-groups/NewTGModal').then((m) => m.NewTGModal),
  { ssr: false }
)

export default function ProjectDetailPageClient({ id }: { id: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { set, clear } = useBreadcrumbs()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`)
      return data
    },
  })

  const {
    data: targetGroups,
    isLoading: tgLoading,
    isError: tgError,
  } = useQuery({
    queryKey: queryKeys.targetGroups(id),
    queryFn: async () => {
      const { data } = await api.get<TargetGroup[]>(`/projects/${id}/target-groups`)
      return data
    },
  })

  useEffect(() => {
    if (project?.business_unit_id) {
      setStoredBusinessUnitId(project.business_unit_id)
    }
  }, [project])

  useEffect(() => {
    set([
      { label: 'Projects', href: '/projects' },
      { label: project?.name ?? '...' },
    ])
    return () => clear()
  }, [set, clear, project?.name])

  return (
    <DashboardShell>
      <div className="pp-page">
        {projectLoading ? (
          <Skeleton className="mb-8 h-12 w-64" />
        ) : (
          <PageHeader
            breadcrumbs={[
              { label: 'Projects', href: '/projects' },
              { label: project?.name ?? '...' },
            ]}
            title={project?.name ?? ''}
            subtitle={project?.short_code}
            badge={
              project ? (
                <StatusBadge
                  label={project.status}
                  className={projectStatusClass(project.status)}
                />
              ) : undefined
            }
            actions={
              <Button
                onClick={() => setModalOpen(true)}
                className="h-10 bg-primary shadow-sm hover:bg-primary/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add target group
              </Button>
            }
          />
        )}

        <Tabs defaultValue="target-groups" className="mt-2">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0"
          >
            <TabsTrigger
              value="target-groups"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-active:border-primary data-active:text-primary"
            >
              Target groups
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-active:border-primary data-active:text-primary"
            >
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="target-groups" className="mt-0">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <TGTable
                projectId={id}
                targetGroups={targetGroups}
                isLoading={tgLoading}
                isError={tgError}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-8 shadow-card">
              <dl className="grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="pp-label mb-1">Short code</dt>
                  <dd className="font-mono text-sm font-medium">{project?.short_code}</dd>
                </div>
                <div>
                  <dt className="pp-label mb-1">Customer ref</dt>
                  <dd className="text-sm">{project?.customer_ref_number ?? '—'}</dd>
                </div>
                <div>
                  <dt className="pp-label mb-1">Status</dt>
                  <dd className="capitalize text-sm">{project?.status}</dd>
                </div>
                <div>
                  <dt className="pp-label mb-1">Target groups</dt>
                  <dd className="text-sm">{project?.target_group_count}</dd>
                </div>
              </dl>
            </div>
          </TabsContent>
        </Tabs>

        <NewTGModal projectId={id} open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </DashboardShell>
  )
}
