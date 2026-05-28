'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { formatCpi, formatLanguage } from '@/lib/utils'
import type { RateCardEntry, TargetGroup } from '@/types'
import { Button } from '@/components/ui/button'

type RateCardResponse = {
  currency: string
  entries: RateCardEntry[]
}

type Bracket = { min: number; max: number }

function bracketKey(b: Bracket) {
  return `${b.min}-${b.max}`
}

function uniqBrackets(brackets: Bracket[]) {
  const seen = new Set<string>()
  const out: Bracket[] = []
  for (const b of brackets) {
    const key = bracketKey(b)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(b)
  }
  return out
}

function formatCountryName(code?: string | null) {
  const c = (code ?? '').toUpperCase()
  switch (c) {
    case 'SE':
      return 'Sweden'
    case 'NO':
      return 'Norway'
    case 'DK':
      return 'Denmark'
    case 'FI':
      return 'Finland'
    case 'DE':
      return 'Germany'
    case 'GB':
      return 'United Kingdom'
    case 'US':
      return 'United States'
    default:
      return c || '—'
  }
}

function buildRateCardMatrix(entries: RateCardEntry[]) {
  const loiBrackets = uniqBrackets(
    entries.map((e) => ({ min: e.loi_min_minutes, max: e.loi_max_minutes }))
  ).sort((a, b) => a.min - b.min)

  const irBrackets = uniqBrackets(
    entries.map((e) => ({ min: e.ir_min_pct, max: e.ir_max_pct }))
  ).sort((a, b) => b.max - a.max) // descending — high IR left

  const lookup = new Map<string, RateCardEntry>()
  for (const e of entries) {
    lookup.set(
      `${e.loi_min_minutes}-${e.loi_max_minutes}|${e.ir_min_pct}-${e.ir_max_pct}`,
      e
    )
  }

  const matrix = loiBrackets.map((loi) =>
    irBrackets.map((ir) => {
      const entry = lookup.get(`${loi.min}-${loi.max}|${ir.min}-${ir.max}`)
      return entry ?? null
    })
  )

  return { loiBrackets, irBrackets, matrix }
}

function isInBracket(v: number, b: Bracket) {
  return v >= b.min && v <= b.max
}

export function RateCardMatrixInline({
  open,
  onClose,
  projectId,
  tgId,
  tg,
  businessUnitId,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  tgId: string
  tg: TargetGroup
  businessUnitId?: string
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const buId = businessUnitId ?? getStoredBusinessUnitId()
  const country = tg.country_code ?? undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rate-card', { buId, country }] as const,
    queryFn: async () => {
      if (!buId || !country) return null
      const { data } = await api.get<RateCardResponse>(
        `/pricing/rate-card?business_unit_id=${buId}&country_code=${country}`
      )
      return data
    },
    enabled: open && !!buId && !!country,
    staleTime: 60_000,
    retry: 1,
  })

  const entries = useMemo(() => data?.entries ?? [], [data?.entries])
  const { loiBrackets, irBrackets, matrix } = useMemo(
    () => buildRateCardMatrix(entries),
    [entries]
  )

  const expectedLoi = tg.expected_loi_minutes ?? null
  const expectedIr = tg.expected_ir_pct ?? null

  const activeLoiIndex = useMemo(() => {
    if (expectedLoi == null) return null
    const idx = loiBrackets.findIndex((b) => isInBracket(expectedLoi, b))
    return idx >= 0 ? idx : null
  }, [expectedLoi, loiBrackets])

  const activeIrIndex = useMemo(() => {
    if (expectedIr == null) return null
    const idx = irBrackets.findIndex((b) => isInBracket(expectedIr, b))
    return idx >= 0 ? idx : null
  }, [expectedIr, irBrackets])

  const defaultActiveEntry = useMemo(() => {
    if (activeLoiIndex == null || activeIrIndex == null) return null
    return matrix[activeLoiIndex]?.[activeIrIndex] ?? null
  }, [activeLoiIndex, activeIrIndex, matrix])

  const [selected, setSelected] = useState<{
    loiIndex: number
    irIndex: number
    entry: RateCardEntry
  } | null>(null)

  useEffect(() => {
    if (!open) setSelected(null)
  }, [open])

  const headerCpi =
    selected?.entry?.cpi_amount ??
    defaultActiveEntry?.cpi_amount ??
    tg.base_cpi ??
    null

  const applyMutation = useMutation({
    mutationFn: async (amount: string) => {
      await api.patch(
        `/pricing/projects/${projectId}/target-groups/${tgId}/pricing`,
        { base_cpi: parseFloat(amount) }
      )
    },
    onSuccess: (_, amount) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroups(projectId) })
      toast({ title: `CPI updated to kr ${Number(amount).toFixed(2)}` })
      onClose()
      setSelected(null)
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const showEmpty = open && !isLoading && !isError && entries.length === 0

  const selectedBracketText = useMemo(() => {
    if (!selected) return null
    const loi = loiBrackets[selected.loiIndex]
    const ir = irBrackets[selected.irIndex]
    if (!loi || !ir) return null
    return `${loi.min}-${loi.max} MIN · ${ir.max}-${ir.min}%`
  }, [selected, loiBrackets, irBrackets])

  if (!open) return null

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Rate card</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatCountryName(tg.country_code)} · {formatLanguage(tg.language_code)} ·{' '}
            {data?.currency ?? '—'}
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          onClick={onClose}
          aria-label="Close rate card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-border px-5 py-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
          <div className="space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Country</span>
              <span className="font-semibold text-foreground">
                {formatCountryName(tg.country_code)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Language</span>
              <span className="font-semibold text-foreground">
                {formatLanguage(tg.language_code)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-semibold text-foreground">{data?.currency ?? '—'}</span>
            </div>
          </div>

          <div className="hidden h-full w-px bg-border md:block" />

          <div className="space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Length of interview</span>
              <span className="font-semibold text-foreground">
                {tg.expected_loi_minutes != null ? `${tg.expected_loi_minutes} min` : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Incidence Rate</span>
              <span className="font-semibold text-foreground">
                {tg.expected_ir_pct != null ? `${tg.expected_ir_pct} %` : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">CPI</span>
              <span className="font-semibold text-primary">
                {headerCpi != null ? `kr ${Number(headerCpi).toFixed(2)}` : '—'}
              </span>
            </div>
          </div>

          <div className="hidden h-full w-px bg-border md:block" />

          <div className="space-y-1 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Boost CPI</span>
              <span className="font-semibold text-foreground">{formatCpi(tg.boost_cpi)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Max CPI</span>
              <span className="font-semibold text-foreground">{formatCpi(tg.max_cpi)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground">Business unit</span>
              <span className="font-semibold text-foreground">{buId ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto px-5 py-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading rate card…</div>}
        {isError && <div className="text-sm text-red-600">Failed to load rate card.</div>}
        {showEmpty && (
          <div className="text-sm text-muted-foreground">
            No rate card configured for {tg.country_code ?? 'this country'}
          </div>
        )}

        {!isLoading && !isError && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border border-border bg-card px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                    LOI / IR
                  </th>
                  {irBrackets.map((ir) => (
                    <th
                      key={bracketKey(ir)}
                      className="border border-border bg-card px-3 py-2 text-right text-xs font-semibold text-muted-foreground"
                    >
                      {ir.max}-{ir.min}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loiBrackets.map((loi, i) => (
                  <tr key={bracketKey(loi)}>
                    <td className="sticky left-0 z-10 border border-border bg-card px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
                      {loi.min}-{loi.max} MIN
                    </td>
                    {irBrackets.map((ir, j) => {
                      const entry = matrix[i]?.[j]
                      const amount = entry?.cpi_amount ?? '—'

                      const isActive =
                        selected?.loiIndex === i && selected?.irIndex === j
                          ? true
                          : selected == null && activeLoiIndex === i && activeIrIndex === j

                      const isTintedColumn =
                        activeIrIndex != null && activeIrIndex === j && !isActive

                      return (
                        <td
                          key={`${bracketKey(loi)}|${bracketKey(ir)}`}
                          className={cn(
                            'border border-border px-3 py-2 text-right text-sm',
                            isTintedColumn && 'bg-primary/10 text-foreground',
                            isActive && 'bg-primary text-primary-foreground font-semibold'
                          )}
                        >
                          {entry ? (
                            <button
                              type="button"
                              className={cn('w-full text-right', isActive && 'rounded')}
                              onClick={() => setSelected({ loiIndex: i, irIndex: j, entry })}
                            >
                              {Number(amount).toFixed(2)}
                            </button>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="border-t border-border bg-card px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Apply{' '}
              <span className="font-semibold text-foreground">
                kr {Number(selected.entry.cpi_amount).toFixed(2)}
              </span>{' '}
              {selectedBracketText ? (
                <span className="text-muted-foreground">({selectedBracketText})</span>
              ) : null}{' '}
              to this target group?
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
                disabled={applyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => applyMutation.mutate(selected.entry.cpi_amount)}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? 'Applying…' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

