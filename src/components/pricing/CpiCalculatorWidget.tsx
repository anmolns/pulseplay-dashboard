'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { CpiLookupResult } from '@/types'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCpi } from '@/lib/utils'
import { useCpiCalc } from './CpiCalcContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

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
  const router = useRouter()
  const pathname = usePathname()
  const { inputs } = useCpiCalc()
  const debounced = useDebouncedValue(inputs, 400)

  const { canFetch, blockedReason } = useMemo(() => {
    const buId = getStoredBusinessUnitId()
    if (!buId) return { canFetch: false, blockedReason: 'Missing business unit' }
    if (!debounced.country_code) return { canFetch: false, blockedReason: 'Set Country' }
    if (debounced.loi_minutes == null) return { canFetch: false, blockedReason: 'Set LOI' }
    if (debounced.ir_pct == null) return { canFetch: false, blockedReason: 'Set IR %' }
    const loi = Number(debounced.loi_minutes)
    const ir = Number(debounced.ir_pct)
    if (!Number.isFinite(loi) || loi <= 0) return { canFetch: false, blockedReason: 'Set LOI' }
    if (!Number.isFinite(ir) || ir <= 0 || ir > 100)
      return { canFetch: false, blockedReason: 'Set IR %' }
    return { canFetch: true, blockedReason: null }
  }, [debounced])

  const buId = typeof window !== 'undefined' ? getStoredBusinessUnitId() : null

  const { data, isFetching, isError } = useQuery({
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
      ? formatCostKr(data.cpi_amount, debounced.completes_goal)
      : '—'

  const isTargetGroupRoute =
    typeof pathname === 'string' &&
    /^\/projects\/[^/]+\/target-groups\/[^/]+/.test(pathname)

  return (
    <div className="flex items-center gap-6">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-6 rounded-md px-2 py-1 hover:bg-secondary/60">
          <div className="flex items-center gap-2">
            <span className="pp-label">CPI</span>
            <span className="text-sm font-semibold text-indigo-400">{amount}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {isError && !isFetching && (
              <AlertCircle className="h-4 w-4 text-red-500" aria-label="CPI lookup failed" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="pp-label">COST</span>
            <span className="text-sm font-semibold text-foreground">{cost}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
          </div>

          <div className="hidden min-w-[160px] flex-col lg:flex">
            <span className="text-[11px] text-muted-foreground">
              {bracket || (blockedReason ? `— (${blockedReason})` : '—')}
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[320px] p-0">
          <div className="rounded-lg bg-[#4B1E6D] p-4 text-white">
            <div className="text-[11px] font-semibold tracking-wider text-white/70">
              BUSINESS UNIT
            </div>
            <div className="mt-1 text-sm font-medium">
              {getStoredBusinessUnitId() ?? '—'}
            </div>

            <div className="my-3 h-px bg-white/15" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Cost per interview</span>
              <span className="font-semibold">{amount === '—' ? '—' : `${amount} SEK`}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-white/80">Boost CPI</span>
              <span className="font-semibold">—</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-white/80">Max CPI</span>
              <span className="font-semibold">—</span>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-white/95 text-[#2a0f3e] hover:bg-white"
                disabled={!isTargetGroupRoute}
                onClick={() => {
                  if (!isTargetGroupRoute) return
                  router.push(`${pathname}?cpi=1`)
                }}
              >
                View rate card
              </Button>
              {!isTargetGroupRoute && (
                <div className="mt-2 text-xs text-white/70">
                  Open a target group to view the rate card.
                </div>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-sm"
            onClick={() => router.push('/projects')}
          >
            Go to projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

