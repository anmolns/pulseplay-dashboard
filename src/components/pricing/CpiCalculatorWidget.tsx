'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { CpiLookupResult } from '@/types'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCpi } from '@/lib/utils'
import { useCpiCalc } from './CpiCalcContext'

function formatCostKr(cpiAmount?: string | null, goal?: number) {
  if (!cpiAmount || !goal) return '—'
  const cost = Number(cpiAmount) * goal
  if (Number.isNaN(cost)) return '—'
  return (
    'kr ' +
    cost.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export function CpiCalculatorWidget() {
  const { inputs } = useCpiCalc()
  const debounced = useDebouncedValue(inputs, 400)

  const canFetch = useMemo(() => {
    const buId = getStoredBusinessUnitId()
    if (!buId) return false
    if (!debounced.country_code) return false
    if (debounced.loi_minutes == null || debounced.ir_pct == null) return false
    if (Number.isNaN(Number(debounced.loi_minutes))) return false
    if (Number.isNaN(Number(debounced.ir_pct))) return false
    return true
  }, [debounced])

  const buId = typeof window !== 'undefined' ? getStoredBusinessUnitId() : null

  const { data, isFetching } = useQuery({
    queryKey: [
      'cpi-lookup-widget',
      {
        buId,
        country: debounced.country_code,
        loi: debounced.loi_minutes,
        ir: debounced.ir_pct,
      },
    ] as const,
    queryFn: async () => {
      if (!buId) return null
      const { data } = await api.post<CpiLookupResult>(
        `/pricing/cpi-lookup?business_unit_id=${buId}`,
        {
          country_code: debounced.country_code,
          loi_minutes: Number(debounced.loi_minutes),
          ir_pct: Number(debounced.ir_pct),
        }
      )
      return data
    },
    enabled: canFetch,
    retry: 1,
    staleTime: 0,
  })

  const amount = canFetch && data?.cpi_amount ? formatCpi(data.cpi_amount) : '—'
  const bracket =
    canFetch && data?.loi_bracket && data?.ir_bracket
      ? `${data.loi_bracket} · ${data.ir_bracket}`
      : ''

  const cost =
    canFetch && data?.cpi_amount
      ? formatCostKr(data.cpi_amount, inputs.completes_goal)
      : '—'

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="pp-label">CPI</span>
        <span className="text-sm font-semibold text-indigo-400">{amount}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex items-center gap-2">
        <span className="pp-label">COST</span>
        <span className="text-sm font-semibold text-foreground">{cost}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
      </div>

      <div className="hidden min-w-[160px] flex-col lg:flex">
        <span className="text-[11px] text-muted-foreground">{bracket || '—'}</span>
      </div>
    </div>
  )
}

