import type { LucideIcon } from 'lucide-react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import type { Session, SessionQualityFlag } from '@/types'

export const QUALITY_FILTERS = ['all', 'normal', 'fast', 'speeder', 'slow'] as const
export type QualityFilter = (typeof QUALITY_FILTERS)[number]

export function countryFlagEmoji(code?: string | null): string {
  if (!code || code.length !== 2) return ''
  const upper = code.toUpperCase()
  return upper.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  )
}

export function tierBadgeClass(tier?: string | null): string {
  switch (tier?.toLowerCase()) {
    case 'bronze':
      return 'border-amber-600/40 bg-amber-600/15 text-amber-400'
    case 'silver':
      return 'border-slate-400/30 bg-slate-400/10 text-slate-300'
    case 'gold':
      return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
    case 'platinum':
      return 'border-violet-400/30 bg-violet-400/10 text-violet-300'
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

export function formatTierLabel(tier?: string | null): string {
  if (!tier) return 'Unknown'
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function deviceIcon(deviceType?: string | null): LucideIcon {
  switch (deviceType?.toLowerCase()) {
    case 'tablet':
      return Tablet
    case 'desktop':
      return Monitor
    case 'mobile':
    default:
      return Smartphone
  }
}

export function formatDeviceSubtitle(
  browser?: string | null,
  osName?: string | null
): string | null {
  const parts = [browser, osName].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : null
}

export function qualityBadgeMeta(
  flag?: SessionQualityFlag | string | null,
  speedRatio?: number | null
): { label: string; className: string; title?: string } | null {
  switch (flag?.toLowerCase()) {
    case 'normal':
      return {
        label: 'Normal',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      }
    case 'fast':
      return {
        label: 'Fast',
        className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      }
    case 'speeder':
      return {
        label: 'Speeder ⚠',
        className: 'border-red-500/30 bg-red-500/10 text-red-400',
        title:
          speedRatio != null
            ? `Completed in ${(speedRatio * 100).toFixed(0)}% of expected time — possible fraud`
            : 'Completed faster than expected — possible fraud',
      }
    case 'slow':
      return {
        label: 'Slow',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      }
    default:
      return null
  }
}

export function respondentTooltip(session: Session): string | undefined {
  const r = session.respondent
  if (!r) return undefined
  const parts: string[] = []
  if (r.total_points != null) parts.push(`Points: ${r.total_points.toLocaleString()}`)
  if (r.surveys_completed != null) parts.push(`Surveys: ${r.surveys_completed}`)
  if (r.interests?.length) parts.push(`Interests: ${r.interests.join(', ')}`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function countSpeeders(sessions?: Session[]): number {
  return sessions?.filter((s) => s.quality_flag?.toLowerCase() === 'speeder').length ?? 0
}

export function countFraudHolds(sessions?: Session[]): number {
  return sessions?.filter((s) => s.status === 'fraud_hold').length ?? 0
}

export function isFraudHoldSession(session: Session): boolean {
  return session.status === 'fraud_hold'
}
