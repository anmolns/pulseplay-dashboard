'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Redemption } from '@/types'
import { cn, formatShortId } from '@/lib/utils'

interface RejectRedemptionDialogProps {
  redemption: Redemption | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (note: string) => void
  isPending?: boolean
}

export function RejectRedemptionDialog({
  redemption,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RejectRedemptionDialogProps) {
  const [note, setNote] = useState('')

  const handleOpenChange = (next: boolean) => {
    if (!next) setNote('')
    onOpenChange(next)
  }

  const handleSubmit = () => {
    const trimmed = note.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject redemption</DialogTitle>
          <DialogDescription>
            {redemption
              ? `Reject request from respondent ${formatShortId(redemption.respondent_id, 12)}. A note is required.`
              : 'Provide a reason for rejection.'}
          </DialogDescription>
        </DialogHeader>
        <textarea
          placeholder="Reason for rejection…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className={cn(
            'w-full resize-none rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
          )}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!note.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
