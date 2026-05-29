import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { Report } from '@/types'

const POLL_INTERVAL_MS = 2000

export async function fetchReport(reportId: string): Promise<Report> {
  const { data } = await api.get<Report>(`/reports/${reportId}`)
  return data
}

export function upsertReportInCache(queryClient: QueryClient, report: Report) {
  queryClient.setQueryData<Report[]>(queryKeys.reports, (old) => {
    if (!old?.length) return [report]
    const idx = old.findIndex((r) => r.id === report.id)
    if (idx === -1) return [report, ...old]
    const next = [...old]
    next[idx] = report
    return next
  })
}

/** Poll GET /reports/:id every 2s until completed or failed. */
export function pollReportUntilTerminal(
  reportId: string,
  queryClient: QueryClient
): { stop: () => void } {
  let stopped = false
  let timer: ReturnType<typeof setInterval> | null = null

  const tick = async () => {
    if (stopped) return
    try {
      const report = await fetchReport(reportId)
      upsertReportInCache(queryClient, report)
      if (report.status === 'completed' || report.status === 'failed') {
        stop()
      }
    } catch {
      stop()
    }
  }

  const stop = () => {
    stopped = true
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  void tick()
  timer = setInterval(tick, POLL_INTERVAL_MS)

  return { stop }
}

export async function downloadReportCsv(
  report: Report
): Promise<void> {
  const response = await api.get<Blob>(`/reports/${report.id}/download`, {
    responseType: 'blob',
  })

  const blob = response.data
  const disposition = response.headers['content-disposition'] as string | undefined
  let filename = `report-${report.reference_name || report.id}.csv`
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 120)

  if (disposition) {
    const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(disposition)
    if (match?.[1]) {
      filename = decodeURIComponent(match[1].replace(/"/g, ''))
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function hasProcessingReports(reports?: Report[]): boolean {
  return reports?.some((r) => r.status === 'processing') ?? false
}
