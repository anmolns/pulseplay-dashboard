'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import type { TargetGroup } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LaunchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tgId: string
  tg: TargetGroup
}

function daysRemaining(endDate?: string): string | null {
  if (!endDate) return null
  const end = new Date(endDate)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Ended'
  if (diff === 0) return 'Today'
  return `${diff} day${diff !== 1 ? 's' : ''}`
}

export function LaunchModal({ open, onOpenChange, projectId, tgId, tg }: LaunchModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const launchMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/projects/${projectId}/target-groups/${tgId}/launch`
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroups(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.changelog(projectId, tgId) })
      setApiError(null)
      onOpenChange(false)
      toast({ title: 'Target group is now Live' })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      const detail = e?.response?.data?.detail ?? e?.message ?? 'Launch failed'
      setApiError(String(detail))
    },
  })

  const cpi = tg.base_cpi ? parseFloat(tg.base_cpi) : null
  const goal = tg.completes_goal ?? null
  const hasCostData = cpi !== null && Number.isFinite(cpi) && goal !== null
  const totalCost = hasCostData
    ? `kr ${(cpi! * goal!).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'
  const cpiDisplay = cpi !== null && Number.isFinite(cpi) ? `kr ${cpi.toFixed(2)}` : '—'
  const days = daysRemaining(tg.end_date)

  const handleLaunch = () => {
    setApiError(null)
    launchMutation.mutate()
  }

  const tabTrigger = (value: 'now' | 'schedule', label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={cn(
        'relative px-4 py-2.5 text-sm font-medium transition-colors',
        'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-opacity',
        tab === value
          ? 'text-primary after:bg-primary after:opacity-100'
          : 'text-muted-foreground hover:text-foreground after:opacity-0'
      )}
    >
      {label}
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!launchMutation.isPending) { setApiError(null); onOpenChange(o) } }}>
      <DialogContent
        className="w-full max-w-[480px] gap-0 rounded-xl p-0"
        showCloseButton={false}
      >
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Launch target group
            </DialogTitle>
          </DialogHeader>

          {/* Tab row */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabTrigger('now', 'Launch now')}
            {tabTrigger('schedule', 'Schedule for later')}
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to set this target group to Live and let respondents into your survey.
            </p>

            {/* Schedule date picker (schedule tab only) */}
            {tab === 'schedule' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="pp-label shrink-0">Launch date</span>
                <input
                  type="datetime-local"
                  className="h-9 rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">(Europe/Stockholm)</span>
              </div>
            )}

            {/* End date row */}
            {tg.end_date && (
              <div className="flex items-center gap-3 text-sm">
                <span className="pp-label shrink-0">End date</span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(tg.end_date)}
                </span>
                {days && <span className="text-muted-foreground">{days}</span>}
              </div>
            )}

            {/* Cost breakdown card */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm font-semibold text-primary">Projected cost</p>
              <div className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completes goal</span>
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    {goal != null ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#16A34A' }} />
                        {goal.toLocaleString()}
                      </>
                    ) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CPI</span>
                  <span>{cpiDisplay}</span>
                </div>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total (actual cost may vary)
                  </span>
                  <span className="text-base font-bold text-foreground">{totalCost}</span>
                </div>
              </div>
              {!hasCostData && (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  Set a CPI and completes goal to see cost estimate.
                </p>
              )}
            </div>

            {apiError && (
              <p className="text-sm text-red-400">{apiError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => { setApiError(null); onOpenChange(false) }}
            disabled={launchMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleLaunch}
            disabled={launchMutation.isPending}
          >
            {launchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Launching…
              </>
            ) : tab === 'now' ? 'Launch now' : 'Schedule launch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
