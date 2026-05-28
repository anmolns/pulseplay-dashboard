'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import { getStoredBusinessUnitId, setStoredBusinessUnitId } from '@/hooks/useAuth'
import type { Project } from '@/types'
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

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  customer_ref_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBusinessUnitId?: string
}

export function NewProjectModal({
  open,
  onOpenChange,
  defaultBusinessUnitId,
}: NewProjectModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [buError, setBuError] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const buId =
        defaultBusinessUnitId ?? getStoredBusinessUnitId()
      if (!buId) throw new Error('Business unit not found')
      const { data } = await api.post<Project>('/projects', {
        name: values.name,
        business_unit_id: buId,
        customer_ref_number: values.customer_ref_number || undefined,
      })
      return data
    },
    onSuccess: (project) => {
      setStoredBusinessUnitId(project.business_unit_id)
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      reset()
      onOpenChange(false)
      toast({ title: 'Project created' })
      router.push(`/projects/${project.id}`)
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (values: FormValues) => {
    const buId = defaultBusinessUnitId ?? getStoredBusinessUnitId()
    if (!buId) {
      setBuError(true)
      return
    }
    setBuError(false)
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-[hsl(276,45%,28%)]">New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="pp-label">
              Name *
            </Label>
            <Input
              id="name"
              className="h-11 border-border bg-white shadow-sm"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_ref_number" className="pp-label">
              Customer ref number
            </Label>
            <Input
              id="customer_ref_number"
              className="h-11 border-border bg-white shadow-sm"
              {...register('customer_ref_number')}
            />
          </div>
          {buError && (
            <p className="text-sm text-red-600">
              Business unit ID unavailable. Open an existing project first.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
