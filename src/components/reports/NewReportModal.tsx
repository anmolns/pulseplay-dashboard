'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileBarChart } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { pollReportUntilTerminal, upsertReportInCache } from '@/lib/reports'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import type { Project, Report, TargetGroup } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  report_type: z.enum(['performance', 'respondent_analysis', 'reconciliation']),
  level: z.enum(['target_group', 'project', 'account']),
  reference_id: z.string().min(1, 'Select a scope for this report'),
  reference_name: z.string().min(1),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const REPORT_TYPES = [
  { value: 'performance', label: 'Performance', desc: 'Completes, conversion, fill rates' },
  {
    value: 'respondent_analysis',
    label: 'Respondent analysis',
    desc: 'Panelist-level breakdown',
  },
  { value: 'reconciliation', label: 'Reconciliation', desc: 'Billing and quota alignment' },
] as const

const LEVELS = [
  { value: 'project', label: 'Project', desc: 'One survey project' },
  { value: 'target_group', label: 'Target group', desc: 'Single TG within a project' },
  { value: 'account', label: 'Account', desc: 'Entire organization' },
] as const

interface NewReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function monthStartIso() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export function NewReportModal({ open, onOpenChange }: NewReportModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: user } = useAuth()
  const [projectId, setProjectId] = useState('')
  const [tgId, setTgId] = useState('')

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
      date_from: monthStartIso(),
      date_to: todayIso(),
    },
  })

  const level = watch('level')
  const reportType = watch('report_type')
  const referenceName = watch('reference_name')

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects')
      return data
    },
    enabled: open,
  })

  const { data: targetGroups, isLoading: tgsLoading } = useQuery({
    queryKey: queryKeys.targetGroups(projectId),
    queryFn: async () => {
      const { data } = await api.get<TargetGroup[]>(
        `/projects/${projectId}/target-groups`
      )
      return data
    },
    enabled: open && level === 'target_group' && !!projectId,
  })

  const activeProjects = useMemo(
    () =>
      [...(projects ?? [])].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return a.name.localeCompare(b.name)
      }),
    [projects]
  )

  const sortedTargetGroups = useMemo(
    () =>
      [...(targetGroups ?? [])].sort((a, b) => {
        const live = ['live', 'paused']
        const aLive = live.includes(a.status)
        const bLive = live.includes(b.status)
        if (aLive && !bLive) return -1
        if (bLive && !aLive) return 1
        return a.name.localeCompare(b.name)
      }),
    [targetGroups]
  )

  useEffect(() => {
    if (!open) return
    setProjectId('')
    setTgId('')
    reset({
      report_type: 'performance',
      level: 'project',
      reference_id: '',
      reference_name: '',
      date_from: monthStartIso(),
      date_to: todayIso(),
    })
  }, [open, reset])

  useEffect(() => {
    setProjectId('')
    setTgId('')
    setValue('reference_id', '')
    setValue('reference_name', '')
  }, [level, setValue])

  useEffect(() => {
    if (level !== 'account' || !user) return
    setValue('reference_id', user.org_id)
    setValue('reference_name', user.full_name ? `${user.full_name}'s org` : 'Organization')
  }, [level, user, setValue])

  useEffect(() => {
    if (level !== 'project' || !projectId) return
    const project = projects?.find((p) => p.id === projectId)
    if (!project) return
    setValue('reference_id', project.id)
    setValue('reference_name', project.name)
  }, [level, projectId, projects, setValue])

  useEffect(() => {
    if (level !== 'target_group' || !tgId) return
    const tg = targetGroups?.find((t) => t.id === tgId)
    if (!tg) return
    setValue('reference_id', tg.id)
    setValue('reference_name', tg.name)
  }, [level, tgId, targetGroups, setValue])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<Report>('/reports', values)
      return data
    },
    onSuccess: (report) => {
      upsertReportInCache(queryClient, report)
      onOpenChange(false)
      pollReportUntilTerminal(report.id, queryClient)
      toast({
        title: 'Report requested',
        description:
          report.status === 'completed'
            ? 'Your report is ready to download.'
            : 'Generating… this usually completes in seconds.',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const reportTypeLabel =
    REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType
  const levelLabel = LEVELS.find((l) => l.value === level)?.label ?? level

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        overlayClassName="bg-black/60 supports-backdrop-filter:backdrop-blur-sm"
        className="!max-w-lg gap-0 overflow-hidden border-border bg-card p-0 shadow-elevated sm:!max-w-lg"
      >
        <div className="border-b border-border bg-secondary/40 px-6 py-5">
          <DialogHeader className="gap-1 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                <FileBarChart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Request report
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Choose scope and date range — no IDs to paste.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-5 px-6 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Report type" error={errors.report_type?.message}>
              <Select
                value={reportType}
                onValueChange={(v) =>
                  v && setValue('report_type', v as FormValues['report_type'])
                }
              >
                <SelectTrigger className="h-10 w-full border-border bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="font-medium">{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Scope level" error={errors.level?.message}>
              <Select
                value={level}
                onValueChange={(v) => v && setValue('level', v as FormValues['level'])}
              >
                <SelectTrigger className="h-10 w-full border-border bg-secondary/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Scope picker */}
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Report scope
            </p>

            {level === 'account' && (
              <p className="text-sm text-foreground">
                Full account export for your organization
                {user?.full_name ? ` (${user.full_name})` : ''}.
              </p>
            )}

            {level === 'project' && (
              <Field label="Project" error={errors.reference_id?.message}>
                {projectsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={projectId}
                    onValueChange={(v) => setProjectId(v ?? '')}
                  >
                    <SelectTrigger className="h-10 w-full border-border bg-card">
                      <SelectValue placeholder="Select a project…" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {p.short_code} · {p.status}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}

            {level === 'target_group' && (
              <div className="space-y-3">
                <Field label="Project">
                  {projectsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={projectId}
                      onValueChange={(v) => {
                        setProjectId(v ?? '')
                        setTgId('')
                        setValue('reference_id', '')
                        setValue('reference_name', '')
                      }}
                    >
                      <SelectTrigger className="h-10 w-full border-border bg-card">
                        <SelectValue placeholder="Select project first…" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{' '}
                            <span className="text-muted-foreground">({p.short_code})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>

                <Field label="Target group" error={errors.reference_id?.message}>
                  {!projectId ? (
                    <p className="text-sm text-muted-foreground">
                      Select a project to load target groups.
                    </p>
                  ) : tgsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : sortedTargetGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No target groups in this project.
                    </p>
                  ) : (
                    <Select value={tgId} onValueChange={(v) => setTgId(v ?? '')}>
                      <SelectTrigger className="h-10 w-full border-border bg-card">
                        <SelectValue placeholder="Select target group…" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTargetGroups.map((tg) => (
                          <SelectItem key={tg.id} value={tg.id}>
                            <span className="font-medium">{tg.name}</span>
                            <span className="ml-2 text-xs capitalize text-muted-foreground">
                              {tg.status} · {tg.short_code}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date from">
              <Input
                type="date"
                className="h-10 border-border bg-secondary/40"
                {...register('date_from')}
              />
            </Field>
            <Field label="Date to">
              <Input
                type="date"
                className="h-10 border-border bg-secondary/40"
                {...register('date_to')}
              />
            </Field>
          </div>

          {(referenceName || level === 'account') && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <span className="text-muted-foreground">You are requesting: </span>
              <span className="font-medium text-foreground">
                {reportTypeLabel}
              </span>
              <span className="text-muted-foreground"> for </span>
              <span className="font-medium text-primary">
                {referenceName || 'your organization'}
              </span>
              <span className="text-muted-foreground"> ({levelLabel})</span>
            </div>
          )}

          <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Requesting…' : 'Request report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
