'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { formatCpi } from '@/lib/utils'
import type { CpiLookupResult, TargetGroup } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CpiLookupModalProps {
  projectId: string
  tgId: string
  tg: TargetGroup
  businessUnitId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CpiLookupModal({
  projectId,
  tgId,
  tg,
  businessUnitId,
  open,
  onOpenChange,
}: CpiLookupModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [loi, setLoi] = useState(String(tg.expected_loi_minutes ?? ''))
  const [ir, setIr] = useState(String(tg.expected_ir_pct ?? ''))
  const [country, setCountry] = useState(tg.country_code ?? 'SE')
  const [result, setResult] = useState<CpiLookupResult | null>(null)

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const buId = businessUnitId ?? getStoredBusinessUnitId()
      if (!buId) throw new Error('Business unit not found')
      const { data } = await api.post<CpiLookupResult>(
        `/pricing/cpi-lookup?business_unit_id=${buId}`,
        {
          country_code: country,
          loi_minutes: Number(loi),
          ir_pct: Number(ir),
        }
      )
      return data
    },
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!result) return
      await api.patch(
        `/pricing/projects/${projectId}/target-groups/${tgId}/pricing`,
        { base_cpi: parseFloat(result.cpi_amount) }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetGroup(projectId, tgId),
      })
      toast({ title: 'Base CPI applied' })
      onOpenChange(false)
      setResult(null)
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lookup CPI from Rate Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>LOI (min)</Label>
              <Input value={loi} onChange={(e) => setLoi(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>IR %</Label>
              <Input value={ir} onChange={(e) => setIr(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => lookupMutation.mutate()}
            disabled={lookupMutation.isPending}
          >
            {lookupMutation.isPending ? 'Looking up...' : 'Lookup'}
          </Button>

          {result && (
            <div className="rounded-md border border-border bg-secondary p-4 text-sm">
              <p className="font-semibold text-foreground">
                {formatCpi(result.cpi_amount)} — {result.loi_bracket}, {result.ir_bracket}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!result || applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            Apply as Base CPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
