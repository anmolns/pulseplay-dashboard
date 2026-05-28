'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import {
  formatRate,
  formatCpi,
  formatDate,
  formatLanguage,
} from '@/lib/utils'
import type { FillRateEntry, TargetGroup } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FillRateChart } from './FillRateChart'
import { CpiLookupModal } from './CpiLookupModal'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { RateCardMatrixModal } from './RateCardMatrixModal'

interface TGOverviewTabProps {
  projectId: string
  tgId: string
  tg: TargetGroup
  businessUnitId?: string
}

type SettingField =
  | 'country_code'
  | 'language_code'
  | 'expected_loi_minutes'
  | 'expected_ir_pct'
  | 'days_in_field'
  | 'start_date'
  | 'end_date'
  | 'live_survey_url'

interface SettingRow {
  label: string
  field: SettingField
  display: string
  editValue: string
  type?: 'text' | 'number' | 'date'
}

export function TGOverviewTab({
  projectId,
  tgId,
  tg,
  businessUnitId,
}: TGOverviewTabProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editingField, setEditingField] = useState<SettingField | null>(null)
  const [editValue, setEditValue] = useState('')
  const [cpiOpen, setCpiOpen] = useState(false)
  const [rateCardOpen, setRateCardOpen] = useState(false)

  // Allow header pricing dropdown to open this modal via `?cpi=1`.
  // We must do this in an effect (not during render), and we should clear the
  // param on close, otherwise the modal will reopen immediately.
  useEffect(() => {
    if (searchParams?.get('cpi') === '1') setCpiOpen(true)
  }, [searchParams])

  const handleCpiOpenChange = (next: boolean) => {
    setCpiOpen(next)
    if (!next && typeof pathname === 'string') {
      router.replace(pathname)
    }
  }

  const { data: fillRate, isLoading: fillLoading, isError: fillError } = useQuery({
    queryKey: queryKeys.fillRate(projectId, tgId),
    queryFn: async () => {
      const { data } = await api.get<FillRateEntry[]>(
        `/projects/${projectId}/target-groups/${tgId}/fill-rate`
      )
      return data
    },
  })

  const patchMutation = useMutation({
    mutationFn: async (payload: Partial<TargetGroup>) => {
      const { data } = await api.patch<TargetGroup>(
        `/projects/${projectId}/target-groups/${tgId}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.targetGroup(projectId, tgId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.changelog(projectId, tgId),
      })
      setEditingField(null)
      toast({ title: 'Saved' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const stats = tg.stats
  const completes = stats?.completes_count ?? 0
  const goal = tg.completes_goal ?? 0

  const settings: SettingRow[] = [
    { label: 'Country', field: 'country_code', display: tg.country_code ?? '—', editValue: tg.country_code ?? '' },
    {
      label: 'Language',
      field: 'language_code',
      display: formatLanguage(tg.language_code),
      editValue: tg.language_code ?? '',
    },
    {
      label: 'LOI',
      field: 'expected_loi_minutes',
      display: tg.expected_loi_minutes ? `${tg.expected_loi_minutes} min` : '—',
      editValue: String(tg.expected_loi_minutes ?? ''),
      type: 'number',
    },
    {
      label: 'IR %',
      field: 'expected_ir_pct',
      display: tg.expected_ir_pct != null ? `${tg.expected_ir_pct}%` : '—',
      editValue: String(tg.expected_ir_pct ?? ''),
      type: 'number',
    },
    {
      label: 'Days in Field',
      field: 'days_in_field',
      display: String(tg.days_in_field),
      editValue: String(tg.days_in_field),
      type: 'number',
    },
    {
      label: 'Start Date',
      field: 'start_date',
      display: formatDate(tg.start_date),
      editValue: tg.start_date?.slice(0, 10) ?? '',
      type: 'date',
    },
    {
      label: 'End Date',
      field: 'end_date',
      display: formatDate(tg.end_date),
      editValue: tg.end_date?.slice(0, 10) ?? '',
      type: 'date',
    },
    {
      label: 'Survey URL',
      field: 'live_survey_url',
      display: tg.live_survey_url ? tg.live_survey_url.slice(0, 40) + '…' : '—',
      editValue: tg.live_survey_url ?? '',
    },
  ]

  const saveField = (field: SettingField, raw: string) => {
    let value: string | number = raw
    if (['expected_loi_minutes', 'expected_ir_pct', 'days_in_field'].includes(field)) {
      value = Number(raw)
    }
    patchMutation.mutate({ [field]: value } as Partial<TargetGroup>)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Entrants', value: stats?.entrants_count?.toLocaleString() ?? '—' },
          { label: 'Prescreens', value: stats?.prescreens_count?.toLocaleString() ?? '—' },
          {
            label: 'Completes',
            value: goal ? `${completes.toLocaleString()} / ${goal}` : completes.toLocaleString(),
            highlight: true,
          },
          { label: 'Conv. Rate', value: formatRate(stats?.conversion_rate) },
        ].map((stat) => (
          <Card key={stat.label} className="border-border shadow-card">
            <CardContent className="pt-6">
              <p className="pp-label">{stat.label}</p>
              <p
                className={
                  stat.highlight
                    ? 'mt-2 text-2xl font-semibold text-primary'
                    : 'mt-2 text-2xl font-semibold text-foreground'
                }
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FillRateChart
        data={fillRate}
        completesGoal={tg.completes_goal}
        isLoading={fillLoading}
        isError={fillError}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.map((row) => (
              <div
                key={row.field}
                className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                {editingField === row.field ? (
                  <Input
                    autoFocus
                    type={row.type ?? 'text'}
                    className="h-9 max-w-[220px] border-border bg-white text-sm shadow-sm"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      saveField(row.field, editValue)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveField(row.field, editValue)
                      if (e.key === 'Escape') setEditingField(null)
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{row.display}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setEditingField(row.field)
                        setEditValue(row.editValue)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Base CPI</span>
                <span className="font-medium">{formatCpi(tg.base_cpi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boost CPI</span>
                <span className="font-medium">{formatCpi(tg.boost_cpi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max CPI</span>
                <span className="font-medium">{formatCpi(tg.max_cpi)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-brand-light"
                onClick={() => setCpiOpen(true)}
              >
                Lookup CPI
              </Button>
              <Button
                variant="outline"
                className="w-full border-border bg-white text-foreground hover:bg-secondary/60"
                onClick={() => setRateCardOpen(true)}
              >
                View Rate Card
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CpiLookupModal
        projectId={projectId}
        tgId={tgId}
        tg={tg}
        businessUnitId={businessUnitId}
        open={cpiOpen}
        onOpenChange={handleCpiOpenChange}
      />

      <RateCardMatrixModal
        open={rateCardOpen}
        onOpenChange={setRateCardOpen}
        projectId={projectId}
        tgId={tgId}
        tg={tg}
        businessUnitId={businessUnitId}
      />
    </div>
  )
}
