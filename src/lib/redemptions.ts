import type { Redemption, RedemptionStatus } from '@/types'

const STATUSES: RedemptionStatus[] = ['pending', 'approved', 'rejected', 'paid']

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value
  return undefined
}

/** Map API redemption payloads to the shape the UI expects. */
export function normalizeRedemption(raw: unknown): Redemption | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const id = readString(r.id)
  if (!id) return null

  const respondentId =
    readString(r.respondent_id) ??
    readString(r.respondentId) ??
    readString(r.panelist_id) ??
    '—'

  const points =
    readNumber(r.points) ??
    readNumber(r.points_amount) ??
    readNumber(r.point_amount) ??
    readNumber(r.amount) ??
    0

  const method =
    readString(r.method) ??
    readString(r.redemption_method) ??
    readString(r.payout_method) ??
    '—'

  const statusRaw = readString(r.status)?.toLowerCase()
  const status = STATUSES.includes(statusRaw as RedemptionStatus)
    ? (statusRaw as RedemptionStatus)
    : 'pending'

  const requestedAt =
    readString(r.requested_at) ??
    readString(r.requestedAt) ??
    readString(r.created_at) ??
    readString(r.createdAt) ??
    ''

  return {
    id,
    respondent_id: respondentId,
    points,
    method,
    status,
    requested_at: requestedAt,
    processed_at: readString(r.processed_at) ?? readString(r.processedAt),
    rejection_note:
      readString(r.rejection_note) ??
      readString(r.rejectionNote) ??
      readString(r.reject_note),
    created_at: readString(r.created_at) ?? readString(r.createdAt),
  }
}

export function normalizeRedemptionsPayload(data: unknown): Redemption[] {
  let list: unknown[] = []

  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) list = obj.items
    else if (Array.isArray(obj.redemptions)) list = obj.redemptions
    else if (Array.isArray(obj.data)) list = obj.data
  }

  return list
    .map(normalizeRedemption)
    .filter((r): r is Redemption => r != null)
}

export function formatRedemptionPoints(points?: number | null): string {
  if (points == null || !Number.isFinite(points)) return '—'
  return points.toLocaleString()
}
