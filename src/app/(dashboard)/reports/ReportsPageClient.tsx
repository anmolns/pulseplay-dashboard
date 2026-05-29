'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { hasProcessingReports, pollReportUntilTerminal } from '@/lib/reports'
import type { Report } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReportTable } from '@/components/reports/ReportTable'
import { Button } from '@/components/ui/button'
import { useBreadcrumbs } from '@/components/layout/BreadcrumbsContext'

const NewReportModal = dynamic(
  () => import('@/components/reports/NewReportModal').then((m) => m.NewReportModal),
  { ssr: false }
)

export default function ReportsPageClient() {
  const [modalOpen, setModalOpen] = useState(false)
  const { set, clear } = useBreadcrumbs()
  const queryClient = useQueryClient()
  const pollersRef = useRef<Map<string, () => void>>(new Map())

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports,
    queryFn: async () => {
      const { data } = await api.get<Report[]>('/reports')
      return data
    },
    refetchInterval: (query) =>
      hasProcessingReports(query.state.data) ? 2000 : false,
  })

  useEffect(() => {
    if (!data) return

    const processingIds = new Set(
      data.filter((r) => r.status === 'processing').map((r) => r.id)
    )

    pollersRef.current.forEach((stop, id) => {
      if (!processingIds.has(id)) {
        stop()
        pollersRef.current.delete(id)
      }
    })

    processingIds.forEach((id) => {
      if (pollersRef.current.has(id)) return
      const { stop } = pollReportUntilTerminal(id, queryClient)
      pollersRef.current.set(id, stop)
    })
  }, [data, queryClient])

  useEffect(() => {
    set([{ label: 'Reports' }])
    return () => clear()
  }, [set, clear])

  useEffect(() => {
    const pollers = pollersRef.current
    return () => {
      pollers.forEach((stop) => stop())
      pollers.clear()
    }
  }, [])

  return (
    <DashboardShell>
      <div className="pp-page">
        <PageHeader
          title="Reports"
          subtitle="Request and download performance reports"
          actions={
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 bg-primary shadow-sm hover:bg-primary/90"
            >
              Request report
            </Button>
          }
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <ReportTable reports={data} isLoading={isLoading} isError={isError} />
        </div>

        <NewReportModal open={modalOpen} onOpenChange={setModalOpen} />
      </div>
    </DashboardShell>
  )
}
