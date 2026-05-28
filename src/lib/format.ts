export function formatRate(rate?: string | null): string {
  if (!rate) return '—'
  return (parseFloat(rate) * 100).toFixed(1) + '%'
}

export function formatCpi(cpi?: string | null): string {
  if (!cpi) return '—'
  return 'kr ' + parseFloat(cpi).toFixed(2)
}

export function formatDuration(ms?: number | null): string {
  if (!ms) return '—'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function formatDate(date?: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date?: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatChartDate(date?: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function timeAgo(date?: string | null): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatChangeType(changeType: string): string {
  return changeType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatReportType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatDateRange(from?: string, to?: string): string {
  if (!from && !to) return '—'
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
  if (from && to) {
    const f = new Date(from)
    const t = new Date(to)
    if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()) {
      return f.toLocaleDateString('en-GB', opts)
    }
    return `${formatDate(from)} – ${formatDate(to)}`
  }
  return formatDate(from || to)
}

const LANGUAGE_LABELS: Record<string, string> = {
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  de: 'German',
  en: 'English',
}

export function formatLanguage(code?: string | null): string {
  if (!code) return '—'
  return LANGUAGE_LABELS[code] || code.toUpperCase()
}

/** First 8 chars of a UUID for compact tables */
export function formatShortId(id?: string | null, visible = 8): string {
  if (!id) return '—'
  if (id.length <= visible) return id
  return `${id.slice(0, visible)}…`
}

export function formatLabel(value?: string | null): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
