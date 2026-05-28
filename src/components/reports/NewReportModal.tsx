'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { Report } from '@/types'
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
  report_type: z.enum(['performance', 'respondent_analysis', 'reconciliation']),
  level: z.enum(['target_group', 'project', 'account']),
  reference_name: z.string().min(1),
  reference_id: z.string().min(1),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewReportModal({ open, onOpenChange }: NewReportModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

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
      report_type: 'performance',
      level: 'project',
      date_from: '2026-05-01',
      date_to: '2026-05-31',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<Report>('/reports', values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      reset()
      onOpenChange(false)
      toast({ title: 'Report requested' })
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
          <DialogTitle>New Report</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={watch('report_type')}
              onValueChange={(v) =>
                v && setValue('report_type', v as FormValues['report_type'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="respondent_analysis">
                  Respondent Analysis
                </SelectItem>
                <SelectItem value="reconciliation">Reconciliation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={watch('level')}
              onValueChange={(v) =>
                v && setValue('level', v as FormValues['level'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="target_group">Target Group</SelectItem>
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reference Name</Label>
            <Input {...register('reference_name')} placeholder="Solera-Maj2026" />
            {errors.reference_name && (
              <p className="text-xs text-red-500">{errors.reference_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reference ID</Label>
            <Input {...register('reference_id')} placeholder="paste project id" />
            {errors.reference_id && (
              <p className="text-xs text-red-500">{errors.reference_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input type="date" {...register('date_from')} />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input type="date" {...register('date_to')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Requesting...' : 'Request Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
