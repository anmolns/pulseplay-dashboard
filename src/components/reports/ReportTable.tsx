'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { reportStatusClass } from '@/lib/status-styles'
import { downloadReportCsv } from '@/lib/reports'
import { formatReportType, formatDateRange } from '@/lib/utils'
import type { Report } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ReportTableProps {
  reports?: Report[]
  isLoading: boolean
  isError: boolean
}

function formatRowCount(count?: number): string | null {
  if (count == null) return null
  return `${count.toLocaleString()} row${count === 1 ? '' : 's'}`
}

export function ReportTable({ reports, isLoading, isError }: ReportTableProps) {
  const { toast } = useToast()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (report: Report) => {
    setDownloadingId(report.id)
    try {
      await downloadReportCsv(report)
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not download file',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="divide-y divide-border p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-5">
            <Skeleton className="h-5 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-400">Failed to load reports</p>
      </div>
    )
  }

  if (!reports?.length) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-medium text-foreground">No reports yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Click &quot;Request report&quot; to generate performance or respondent
          analysis exports.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_100px_1fr_130px_140px_120px] gap-4 border-b border-border bg-secondary/40 px-5 py-3 max-lg:grid-cols-[1fr_100px_120px]">
        <span className="pp-label">Report</span>
        <span className="pp-label max-lg:hidden">Level</span>
        <span className="pp-label max-lg:hidden">Scope</span>
        <span className="pp-label">Period</span>
        <span className="pp-label">Status</span>
        <span className="pp-label text-right">Download</span>
      </div>

      {reports.map((report, idx) => {
        const rowLabel = formatRowCount(report.row_count)
        const isProcessing = report.status === 'processing'
        const isCompleted = report.status === 'completed'
        const isFailed = report.status === 'failed'

        return (
          <div
            key={report.id}
            className={cn(
              'grid grid-cols-[1fr_100px_1fr_130px_140px_120px] items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0 max-lg:grid-cols-[1fr_100px_120px]',
              idx % 2 === 1 && 'bg-secondary/15'
            )}
          >
            <div>
              <p className="font-medium text-foreground">
                {formatReportType(report.report_type)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground lg:hidden">
                {report.reference_name} · {report.level.replace('_', ' ')}
              </p>
            </div>
            <span className="text-sm capitalize text-muted-foreground max-lg:hidden">
              {report.level.replace('_', ' ')}
            </span>
            <span className="truncate text-sm text-foreground max-lg:hidden">
              {report.reference_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateRange(report.date_from, report.date_to)}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                {isProcessing && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-400" />
                )}
                <StatusBadge
                  label={report.status}
                  className={reportStatusClass(report.status)}
                />
              </div>
              {isCompleted && rowLabel && (
                <span className="text-xs font-medium text-muted-foreground">
                  {rowLabel}
                </span>
              )}
            </div>
            <div className="flex justify-end">
              {isCompleted && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  disabled={downloadingId === report.id}
                  onClick={() => handleDownload(report)}
                >
                  {downloadingId === report.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download CSV
                </Button>
              )}
              {isFailed && <span className="text-xs text-muted-foreground">—</span>}
              {isProcessing && (
                <span className="text-xs text-muted-foreground">…</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
