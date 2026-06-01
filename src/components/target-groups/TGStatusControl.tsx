'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Loader2, MoreHorizontal } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { TargetGroup } from '@/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { LaunchModal } from './LaunchModal'

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-muted-foreground',
  live: 'bg-[#16A34A]',
  paused: 'bg-[#D97706]',
  closed: 'bg-muted-foreground',
  archived: 'bg-muted-foreground',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  live: 'Live',
  paused: 'Paused',
  closed: 'Closed',
  archived: 'Archived',
}

interface TGStatusControlProps {
  projectId: string
  tgId: string
  tg: TargetGroup
}

export function TGStatusControl({
  projectId,
  tgId,
  tg,
}: TGStatusControlProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [launchOpen, setLaunchOpen] = useState(false)
  const [confirm, setConfirm] = useState<'pause' | 'close' | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.targetGroups(projectId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.changelog(projectId, tgId) })
  }

  const pauseMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/target-groups/${tgId}/pause`),
    onSuccess: () => { invalidate(); setConfirm(null); toast({ title: 'Target group paused' }) },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/target-groups/${tgId}/close`),
    onSuccess: () => { invalidate(); setConfirm(null); toast({ title: 'Target group closed' }) },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const { status } = tg
  const isReadonly = status === 'closed' || status === 'archived'

  const dropdownItems = () => {
    switch (status) {
      case 'draft':
        return [
          { label: 'Launch now', onClick: () => setLaunchOpen(true) },
          { label: 'Delete', onClick: () => {} },
        ]
      case 'live':
        return [
          { label: 'Pause', onClick: () => setConfirm('pause') },
          { label: 'Close', onClick: () => setConfirm('close') },
        ]
      case 'paused':
        return [
          { label: 'Launch', onClick: () => setLaunchOpen(true) },
          { label: 'Close', onClick: () => setConfirm('close') },
        ]
      default:
        return []
    }
  }

  const items = dropdownItems()

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Three-dots menu */}
        <Button variant="outline" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isReadonly || items.length === 0}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors',
              'hover:bg-secondary/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status] ?? STATUS_DOT.draft)} />
            {STATUS_LABEL[status] ?? status}
            {!isReadonly && items.length > 0 && (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </DropdownMenuTrigger>
          {items.length > 0 && (
            <DropdownMenuContent align="end">
              {items.map((item) => (
                <DropdownMenuItem key={item.label} onClick={item.onClick}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>

      </div>

      {/* Launch modal */}
      <LaunchModal
        open={launchOpen}
        onOpenChange={setLaunchOpen}
        projectId={projectId}
        tgId={tgId}
        tg={tg}
      />

      {/* Pause confirmation */}
      {confirm === 'pause' && (
        <ConfirmDialog
          title="Pause this target group?"
          message="Respondents will not be routed until it is re-launched."
          confirmLabel="Pause"
          confirmClassName="bg-[#D97706] text-white hover:bg-[#D97706]/90"
          loading={pauseMutation.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => pauseMutation.mutate()}
        />
      )}

      {/* Close confirmation */}
      {confirm === 'close' && (
        <ConfirmDialog
          title="Close this target group?"
          message="This cannot be re-opened."
          confirmLabel="Close"
          confirmClassName="border border-[#DC2626] text-[#DC2626] hover:bg-red-500/10 bg-transparent"
          loading={closeMutation.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => closeMutation.mutate()}
        />
      )}
    </>
  )
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClassName,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmClassName: string
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-[360px] rounded-xl border border-border bg-card p-5 shadow-elevated">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <button
            type="button"
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors',
              confirmClassName
            )}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
