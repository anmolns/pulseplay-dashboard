'use client'

import { Loader2, Download } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { reportStatusClass } from '@/lib/status-styles'
import { formatReportType, formatDateRange } from '@/lib/utils'
import type { Report } from '@/types'

interface ReportTableProps {
  reports?: Report[]
  isLoading: boolean
  isError: boolean
}

export function ReportTable({ reports, isLoading, isError }: ReportTableProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-5">
            <Skeleton className="h-5 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-red-600">
        Failed to load reports.
      </p>
    )
  }

  if (!reports?.length) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-medium text-foreground">No reports yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Request your first report to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_120px_1fr_140px_140px_100px] gap-4 border-b border-border bg-secondary/40 px-6 py-3">
        <span className="pp-label">Type</span>
        <span className="pp-label">Level</span>
        <span className="pp-label">Reference</span>
        <span className="pp-label">Date range</span>
        <span className="pp-label">Status</span>
        <span className="pp-label text-right">Action</span>
      </div>

      {reports.map((report) => (
        <div
          key={report.id}
          className="grid grid-cols-[1fr_120px_1fr_140px_140px_100px] items-center gap-4 border-b border-border/80 px-6 py-5 last:border-0 hover:bg-brand-light/30"
        >
          <span className="font-medium text-foreground">
            {formatReportType(report.report_type)}
          </span>
          <span className="text-sm capitalize text-muted-foreground">
            {report.level.replace('_', ' ')}
          </span>
          <span className="text-sm text-foreground">{report.reference_name}</span>
          <span className="text-sm text-muted-foreground">
            {formatDateRange(report.date_from, report.date_to)}
          </span>
          <div className="flex items-center gap-2">
            {report.status === 'processing' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            )}
            <StatusBadge
              label={report.status}
              className={reportStatusClass(report.status)}
            />
          </div>
          <div className="text-right">
            {report.status === 'completed' && report.file_url && (
              <a
                href={report.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
