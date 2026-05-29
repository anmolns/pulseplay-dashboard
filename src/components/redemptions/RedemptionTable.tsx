'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { redemptionStatusClass } from '@/lib/status-styles'
import { formatRedemptionPoints } from '@/lib/redemptions'
import { formatDateTime, formatShortId } from '@/lib/utils'
import type { Redemption, RedemptionStatus } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { RejectRedemptionDialog } from './RejectRedemptionDialog'

interface RedemptionTableProps {
  redemptions?: Redemption[]
  tabStatus: RedemptionStatus
  isLoading: boolean
  isError: boolean
}

export function RedemptionTable({
  redemptions,
  tabStatus,
  isLoading,
  isError,
}: RedemptionTableProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<Redemption | null>(null)

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      note,
    }: {
      id: string
      action: 'approve' | 'reject'
      note?: string
    }) => {
      const body =
        action === 'reject'
          ? { action: 'reject' as const, note: note! }
          : { action: 'approve' as const }
      const { data } = await api.patch<Redemption>(`/redemptions/${id}`, body)
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] })
      setRejectTarget(null)
      toast({
        title: vars.action === 'approve' ? 'Redemption approved' : 'Redemption rejected',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Action failed',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="divide-y divide-border p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-5">
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-400">Failed to load redemptions</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ensure you are signed in as an admin.
        </p>
      </div>
    )
  }

  if (!redemptions?.length) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <Gift className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 font-medium text-foreground">No {tabStatus} redemptions</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {tabStatus === 'pending'
            ? 'New reward requests will appear here for review.'
            : 'Nothing in this tab yet.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {['Respondent ID', 'Points', 'Method', 'Status', 'Requested', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {redemptions.map((r, idx) => (
              <tr
                key={r.id}
                className={idx % 2 === 1 ? 'bg-secondary/20' : undefined}
              >
                <td className="px-5 py-3.5">
                  <span
                    className="font-mono text-xs text-foreground"
                    title={r.respondent_id}
                  >
                    {formatShortId(r.respondent_id, 14)}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium tabular-nums text-foreground">
                  {formatRedemptionPoints(r.points)}
                </td>
                <td className="px-5 py-3.5 capitalize text-foreground">
                  {r.method ? r.method.replace(/_/g, ' ') : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge
                    label={r.status}
                    className={redemptionStatusClass(r.status)}
                  />
                </td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">
                  {formatDateTime(r.requested_at)}
                </td>
                <td className="px-5 py-3.5">
                  {tabStatus === 'pending' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 bg-primary hover:bg-primary/90"
                        disabled={actionMutation.isPending}
                        onClick={() =>
                          actionMutation.mutate({ id: r.id, action: 'approve' })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-500/40 text-red-400 hover:bg-red-500/10"
                        disabled={actionMutation.isPending}
                        onClick={() => setRejectTarget(r)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : tabStatus === 'rejected' && r.rejection_note ? (
                    <p
                      className="max-w-[200px] truncate text-xs text-muted-foreground"
                      title={r.rejection_note}
                    >
                      {r.rejection_note}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RejectRedemptionDialog
        redemption={rejectTarget}
        open={rejectTarget != null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null)
        }}
        isPending={actionMutation.isPending}
        onConfirm={(note) => {
          if (!rejectTarget) return
          actionMutation.mutate({
            id: rejectTarget.id,
            action: 'reject',
            note,
          })
        }}
      />
    </>
  )
}
