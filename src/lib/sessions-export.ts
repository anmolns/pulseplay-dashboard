import api from '@/lib/api'

export async function downloadSessionsCsv(
  projectId: string,
  tgId: string,
  options?: { status?: string; mode?: string }
): Promise<void> {
  const params = new URLSearchParams()
  params.set('status', options?.status ?? 'completed')
  if (options?.mode && options.mode !== 'all') {
    params.set('mode', options.mode)
  }

  const response = await api.get<Blob>(
    `/projects/${projectId}/target-groups/${tgId}/sessions/export?${params}`,
    { responseType: 'blob' }
  )

  const blob = response.data
  const disposition = response.headers['content-disposition'] as string | undefined
  let filename = `sessions-${tgId.slice(0, 8)}.csv`

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
