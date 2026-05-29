'use client'

import { Clock, Copy, Globe, Monitor, Shield, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { sessionStatusClass } from '@/lib/status-styles'
import {
  countryFlagEmoji,
  deviceIcon,
  formatDeviceSubtitle,
  formatTierLabel,
  qualityBadgeMeta,
  tierBadgeClass,
} from '@/lib/session-tracking'
import {
  formatDateTime,
  formatDuration,
  formatLabel,
  formatShortId,
} from '@/lib/utils'
import type { Session } from '@/types'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SessionDetailDialogProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/80 bg-secondary/30 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

function QualityBadge({
  flag,
  speedRatio,
  large,
}: {
  flag?: Session['quality_flag']
  speedRatio?: number | null
  large?: boolean
}) {
  const meta = qualityBadgeMeta(flag, speedRatio)
  if (!meta) {
    return (
      <span className="text-sm text-muted-foreground">Not scored yet</span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
        meta.className
      )}
      title={meta.title}
    >
      {meta.label}
    </span>
  )
}

export function SessionDetailDialog({
  session,
  open,
  onOpenChange,
}: SessionDetailDialogProps) {
  const { toast } = useToast()

  if (!session) return null

  const DeviceIcon = deviceIcon(session.device_type)
  const respondent = session.respondent
  const deviceSubtitle = formatDeviceSubtitle(session.browser, session.os_name)

  const copyId = () => {
    void navigator.clipboard.writeText(session.id)
    toast({ title: 'Session ID copied' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        overlayClassName="bg-black/60 supports-backdrop-filter:backdrop-blur-sm"
        className="!max-w-3xl gap-0 overflow-hidden border-border bg-card p-0 shadow-elevated sm:!max-w-3xl"
      >
        {/* Header strip */}
        <div className="border-b border-border bg-secondary/40 px-6 py-5">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Session details
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {formatShortId(session.id, 12)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={copyId}
              >
                <Copy className="h-3 w-3" />
                Copy ID
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge
              label={session.status.replace(/_/g, ' ')}
              className={sessionStatusClass(session.status)}
            />
            <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium capitalize text-foreground">
              {session.mode} mode
            </span>
            <QualityBadge
              flag={session.quality_flag}
              speedRatio={session.speed_ratio}
              large
            />
          </div>
        </div>

        <div className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5">
          {/* Timeline row */}
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetaItem label="Started">{formatDateTime(session.started_at)}</MetaItem>
            <MetaItem label="Completed">
              {session.completed_at ? formatDateTime(session.completed_at) : '—'}
            </MetaItem>
            <MetaItem label="Duration">{formatDuration(session.completion_time_ms)}</MetaItem>
            <MetaItem label="Source">{formatLabel(session.completion_source)}</MetaItem>
          </div>

          {session.reason_label && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <span className="font-medium">Reason: </span>
              {session.reason_label}
            </div>
          )}

          {/* Three panels */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Respondent */}
            <section className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Respondent
                </h4>
              </div>
              {respondent || session.respondent_id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {respondent?.tier && (
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                          tierBadgeClass(respondent.tier)
                        )}
                      >
                        {formatTierLabel(respondent.tier)}
                      </span>
                    )}
                    {respondent?.country_code && (
                      <span className="flex items-center gap-1 text-sm text-foreground">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        {countryFlagEmoji(respondent.country_code)}{' '}
                        {respondent.country_code.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {respondent?.total_points != null && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-card px-2 py-2 text-center">
                        <p className="text-lg font-semibold text-primary">
                          {respondent.total_points.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Points</p>
                      </div>
                      <div className="rounded-lg bg-card px-2 py-2 text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {respondent.surveys_completed ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Surveys</p>
                      </div>
                    </div>
                  )}
                  {respondent?.interests && respondent.interests.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Interests
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {respondent.interests.map((interest) => (
                          <span
                            key={interest}
                            className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] capitalize text-foreground"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {session.respondent_id && (
                    <p className="break-all font-mono text-[10px] text-muted-foreground">
                      {session.respondent_id}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}
            </section>

            {/* Device */}
            <section className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Device
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card">
                  <DeviceIcon className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="font-medium capitalize text-foreground">
                    {session.device_type ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deviceSubtitle ?? 'No browser / OS data'}
                  </p>
                </div>
              </div>
            </section>

            {/* Quality */}
            <section className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quality
                </h4>
              </div>
              <QualityBadge flag={session.quality_flag} speedRatio={session.speed_ratio} large />
              {session.speed_ratio != null && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Completed in {(session.speed_ratio * 100).toFixed(0)}% of expected LOI
                </p>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QualityBadgeInline({
  flag,
  speedRatio,
}: {
  flag?: Session['quality_flag']
  speedRatio?: number | null
}) {
  const meta = qualityBadgeMeta(flag, speedRatio)
  if (!meta) {
    return (
      <span className="text-xs italic text-muted-foreground/60">Not scored</span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.className
      )}
      title={meta.title}
    >
      {meta.label}
    </span>
  )
}

export function SessionDeviceCell({ session }: { session: Session }) {
  const DeviceIcon = deviceIcon(session.device_type)
  const subtitle = formatDeviceSubtitle(session.browser, session.os_name)

  if (!session.device_type && !subtitle) {
    return (
      <span className="text-xs italic text-muted-foreground/60">No device data</span>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <DeviceIcon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium capitalize text-foreground">
          {session.device_type ?? 'Unknown'}
        </p>
        {subtitle && (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export function SessionRespondentCell({ session }: { session: Session }) {
  const respondent = session.respondent
  const tooltip = respondent
    ? [
        respondent.total_points != null && `Points: ${respondent.total_points}`,
        respondent.surveys_completed != null && `Surveys: ${respondent.surveys_completed}`,
        respondent.interests?.length && `Interests: ${respondent.interests.join(', ')}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined

  if (respondent) {
    return (
      <div className="space-y-1" title={tooltip}>
        <div className="flex items-center gap-2">
          {respondent.tier && (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                tierBadgeClass(respondent.tier)
              )}
            >
              {formatTierLabel(respondent.tier)}
            </span>
          )}
          {respondent.country_code && (
            <span
              className="text-sm leading-none"
              aria-label={respondent.country_code}
            >
              {countryFlagEmoji(respondent.country_code)}
            </span>
          )}
        </div>
        {session.respondent_id ? (
          <p className="font-mono text-[10px] text-muted-foreground">
            {formatShortId(session.respondent_id, 12)}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Panelist linked</p>
        )}
      </div>
    )
  }

  if (session.respondent_id) {
    return (
      <div title={session.respondent_id}>
        <p className="text-xs text-muted-foreground">ID only</p>
        <p className="font-mono text-xs text-foreground">
          {formatShortId(session.respondent_id, 12)}
        </p>
      </div>
    )
  }

  return (
    <span className="text-xs italic text-muted-foreground/60">Not assigned</span>
  )
}

export { QualityBadgeInline as SessionQualityBadge }
