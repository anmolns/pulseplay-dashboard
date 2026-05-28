'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { setStoredBusinessUnitId } from '@/hooks/useAuth'
import type { Project } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { Button } from '@/components/ui/button'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'

const NewProjectModal = dynamic(
  () =>
    import('@/components/projects/NewProjectModal').then((m) => m.NewProjectModal),
  { ssr: false }
)

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
          actions={
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 bg-primary px-5 shadow-sm hover:bg-primary/90"
            >
              Create project
            </Button>
          }
        />

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
