'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { formatCpi, formatLanguage } from '@/lib/utils'
import type { RateCardEntry, TargetGroup } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

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

export function RateCardMatrixModal({
  open,
  onOpenChange,
  projectId,
  tgId,
  tg,
  businessUnitId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const { loiBrackets, irBrackets, matrix } = useMemo(() => buildRateCardMatrix(entries), [entries])

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

  const headerCpi = selected?.entry?.cpi_amount ?? defaultActiveEntry?.cpi_amount ?? tg.base_cpi ?? null

  const applyMutation = useMutation({
    mutationFn: async (amount: string) => {
      await api.patch(
        `/pricing/projects/${projectId}/target-groups/${tgId}/pricing`,
        { base_cpi: parseFloat(amount) }
      )
    },
    onSuccess: (_, amount) => {
      // Optimistic cache update so the UI changes immediately, even if refetch is slow.
      queryClient.setQueryData(queryKeys.targetGroup(projectId, tgId), (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev
        return { ...(prev as Record<string, unknown>), base_cpi: amount }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.targetGroups(projectId) })
      queryClient.refetchQueries({ queryKey: queryKeys.targetGroup(projectId, tgId) })
      toast({ title: `CPI updated to kr ${Number(amount).toFixed(2)}` })
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className="w-[calc(100vw-2rem)] max-w-[980px] overflow-hidden rounded-2xl p-0 sm:max-w-[980px]"
      >
        <div className="flex max-h-[calc(100vh-6rem)] flex-col bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="mb-4 pr-10 text-lg font-semibold tracking-tight text-gray-900">
              {tg.name || 'Rate card'}
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
              <div className="space-y-1 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Country</span>
                  <span className="font-semibold text-gray-900">
                    {formatCountryName(tg.country_code)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Language</span>
                  <span className="font-semibold text-gray-900">
                    {formatLanguage(tg.language_code)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-semibold text-gray-900">{data?.currency ?? '—'}</span>
                </div>
              </div>

              <div className="hidden h-full w-px bg-gray-200 md:block" />

              <div className="space-y-1 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Length of interview</span>
                  <span className="font-semibold text-gray-900">
                    {tg.expected_loi_minutes != null ? `${tg.expected_loi_minutes} min` : '—'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Incidence Rate</span>
                  <span className="font-semibold text-gray-900">
                    {tg.expected_ir_pct != null ? `${tg.expected_ir_pct} %` : '—'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">CPI</span>
                  <span className="font-semibold text-indigo-600">
                    {headerCpi != null ? `kr ${Number(headerCpi).toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              <div className="hidden h-full w-px bg-gray-200 md:block" />

              <div className="space-y-1 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Boost CPI</span>
                  <span className="font-semibold text-gray-900">{formatCpi(tg.boost_cpi)}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Max CPI</span>
                  <span className="font-semibold text-gray-900">{formatCpi(tg.max_cpi)}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-gray-500">Business unit</span>
                  <span className="font-semibold text-gray-900">{buId ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto px-5 py-4">
            {isLoading && <div className="text-sm text-gray-500">Loading rate card…</div>}
            {isError && (
              <div className="text-sm text-red-600">Failed to load rate card.</div>
            )}
            {showEmpty && (
              <div className="text-sm text-gray-600">
                No rate card configured for {tg.country_code ?? 'this country'}
              </div>
            )}

            {!isLoading && !isError && entries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                        LOI / IR
                      </th>
                      {irBrackets.map((ir) => (
                        <th
                          key={bracketKey(ir)}
                          className="border border-gray-200 bg-white px-3 py-2 text-right text-xs font-semibold text-gray-500"
                        >
                          {ir.max}-{ir.min}%
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loiBrackets.map((loi, i) => (
                      <tr key={bracketKey(loi)}>
                        <td className="sticky left-0 z-10 border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                          {loi.min}-{loi.max} MIN
                        </td>
                        {irBrackets.map((ir, j) => {
                          const entry = matrix[i]?.[j]
                          const amount = entry?.cpi_amount ?? '—'

                          const isActive =
                            selected?.loiIndex === i && selected?.irIndex === j
                              ? true
                              : selected == null &&
                                activeLoiIndex === i &&
                                activeIrIndex === j

                          const isTintedColumn =
                            activeIrIndex != null && activeIrIndex === j && !isActive

                          return (
                            <td
                              key={`${bracketKey(loi)}|${bracketKey(ir)}`}
                              className={cn(
                                'border border-gray-200 px-3 py-2 text-right text-sm',
                                isTintedColumn && 'bg-indigo-50 text-gray-900',
                                isActive && 'bg-indigo-600 text-white font-semibold'
                              )}
                            >
                              {entry ? (
                                <button
                                  type="button"
                                  className={cn(
                                    'w-full text-right',
                                    isActive && 'rounded'
                                  )}
                                  onClick={() => setSelected({ loiIndex: i, irIndex: j, entry })}
                                >
                                  {Number(amount).toFixed(2)}
                                </button>
                              ) : (
                                <span className="text-gray-400">—</span>
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
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700">
                  Apply{' '}
                  <span className="font-semibold text-gray-900">
                    kr {Number(selected.entry.cpi_amount).toFixed(2)}
                  </span>{' '}
                  {selectedBracketText ? (
                    <span className="text-gray-500">({selectedBracketText})</span>
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
      </DialogContent>
    </Dialog>
  )
}

