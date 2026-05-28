'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { TargetGroup } from '@/types'
import { useEffect } from 'react'
import { useCpiCalc } from '@/components/pricing/CpiCalcContext'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(1),
  country_code: z.string().min(1),
  language_code: z.string().min(1),
  study_type: z.enum(['adhoc', 'tracker', 'diary']),
  completes_goal: z.number().optional(),
  expected_loi_minutes: z.number().optional(),
  expected_ir_pct: z.number().min(1).max(100).optional(),
  days_in_field: z.number(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  live_survey_url: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewTGModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTGModal({ projectId, open, onOpenChange }: NewTGModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { setInputs, clear } = useCpiCalc()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      country_code: 'SE',
      language_code: 'sv',
      study_type: 'adhoc',
      days_in_field: 10,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<TargetGroup>(
        `/projects/${projectId}/target-groups`,
        {
          ...values,
          timezone: 'Europe/Stockholm',
          prevent_overfilling: true,
          balanced_fill: false,
        }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetGroups(projectId),
      })
      reset()
      onOpenChange(false)
      toast({ title: 'Target group created' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const country = watch('country_code')
  const loi = watch('expected_loi_minutes')
  const ir = watch('expected_ir_pct')
  const completesGoal = watch('completes_goal')

  useEffect(() => {
    if (!open) return
    setInputs({
      country_code: country || undefined,
      loi_minutes: typeof loi === 'number' ? loi : undefined,
      ir_pct: typeof ir === 'number' ? ir : undefined,
      completes_goal: typeof completesGoal === 'number' ? completesGoal : undefined,
    })
  }, [open, country, loi, ir, completesGoal, setInputs])

  useEffect(() => {
    if (open) return
    clear()
  }, [open, clear])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 h-screen w-full max-w-xl overflow-y-auto rounded-none border-l border-border bg-card shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Target Group</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-3"
        >
          <div className="space-y-2">
            <Label className="pp-label">Name *</Label>
            <Input className="h-11 border-border bg-white shadow-sm" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="pp-label">Country</Label>
              <Select
                value={watch('country_code')}
                onValueChange={(v) => v && setValue('country_code', v)}
              >
                <SelectTrigger className="h-11 border-border bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="pp-label">Language</Label>
              <Select
                value={watch('language_code')}
                onValueChange={(v) => v && setValue('language_code', v)}
              >
                <SelectTrigger className="h-11 border-border bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['sv', 'no', 'da', 'fi', 'de', 'en'].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="pp-label">Study Type</Label>
            <Select
              value={watch('study_type')}
              onValueChange={(v) =>
                v && setValue('study_type', v as FormValues['study_type'])
              }
            >
              <SelectTrigger className="h-11 border-border bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adhoc">Adhoc</SelectItem>
                <SelectItem value="tracker">Tracker</SelectItem>
                <SelectItem value="diary">Diary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="pp-label">Completes Goal</Label>
              <Input
                type="number"
                className="h-11 border-border bg-white shadow-sm"
                {...register('completes_goal', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label className="pp-label">Expected LOI (min)</Label>
              <Input
                type="number"
                className="h-11 border-border bg-white shadow-sm"
                {...register('expected_loi_minutes', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label className="pp-label">Expected IR %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                className="h-11 border-border bg-white shadow-sm"
                {...register('expected_ir_pct', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label className="pp-label">Days in Field</Label>
              <Input
                type="number"
                className="h-11 border-border bg-white shadow-sm"
                {...register('days_in_field', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="pp-label">Start Date</Label>
              <Input type="date" className="h-11 border-border bg-white shadow-sm" {...register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label className="pp-label">End Date</Label>
              <Input type="date" className="h-11 border-border bg-white shadow-sm" {...register('end_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="pp-label">Live Survey URL</Label>
            <Input className="h-11 border-border bg-white shadow-sm" {...register('live_survey_url')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
