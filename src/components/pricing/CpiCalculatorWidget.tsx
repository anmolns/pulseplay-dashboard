'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { CpiLookupResult, TargetGroup } from '@/types'
import { getStoredBusinessUnitId } from '@/hooks/useAuth'
import { formatCpi } from '@/lib/utils'
import { useCpiCalc } from './CpiCalcContext'
import { queryKeys } from '@/lib/query-keys'
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

function isValidCpiInputs(country?: string, loi?: number, ir?: number): boolean {
  if (!country) return false
  const loiNum = Number(loi)
  const irNum = Number(ir)
  if (!loi || !ir || !Number.isFinite(loiNum) || loiNum <= 0) return false
  if (!Number.isFinite(irNum) || irNum <= 0 || irNum > 100) return false
  return true
}

export function CpiCalculatorWidget() {
  const router = useRouter()
  const pathname = usePathname()
  const { inputs } = useCpiCalc()
  const [cpiResult, setCpiResult] = useState<CpiLookupResult | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isError, setIsError] = useState(false)

  const loi = inputs.loi_minutes
  const ir = inputs.ir_pct
  const country = inputs.country_code
  const canLookup = isValidCpiInputs(country, loi, ir)

  const lookupCpi = useDebouncedCallback(
    async (lookupCountry: string, lookupLoi: number, lookupIr: number) => {
      if (
        !lookupCountry ||
        !lookupLoi ||
        !lookupIr ||
        lookupLoi <= 0 ||
        lookupIr <= 0
      ) {
        setCpiResult(null)
        return
      }

      const buId = getStoredBusinessUnitId()
      if (!buId) return

      setIsFetching(true)
      setIsError(false)
      try {
        const { data } = await api.post<CpiLookupResult>(
          `/pricing/cpi-lookup?business_unit_id=${buId}`,
          {
            country_code: lookupCountry,
            loi_minutes: lookupLoi,
            ir_pct: lookupIr,
          }
        )
        setCpiResult(data)
      } catch {
        setCpiResult(null)
        setIsError(true)
      } finally {
        setIsFetching(false)
      }
    },
    500
  )

  useEffect(() => {
    if (!canLookup || loi == null || ir == null || !country) {
      lookupCpi.cancel()
      setCpiResult(null)
      setIsFetching(false)
      setIsError(false)
      return
    }

    lookupCpi(country, loi, ir)
    return () => lookupCpi.cancel()
  }, [canLookup, country, loi, ir, lookupCpi])

  const tgRoute = useMemo(() => {
    if (typeof pathname !== 'string') return null
    const m = pathname.match(/^\/projects\/([^/]+)\/target-groups\/([^/]+)/)
    if (!m) return null
    return { projectId: m[1], tgId: m[2] }
  }, [pathname])

  const blockedReason = useMemo(() => {
    const buId = getStoredBusinessUnitId()
    if (!buId) return 'Missing business unit'
    if (!country) return 'Set Country'
    if (loi == null) return 'Set LOI'
    if (ir == null) return 'Set IR %'
    const loiNum = Number(loi)
    const irNum = Number(ir)
    if (!Number.isFinite(loiNum) || loiNum <= 0) return 'Set LOI'
    if (!Number.isFinite(irNum) || irNum <= 0 || irNum > 100) return 'Set IR %'
    return null
  }, [country, loi, ir])

  const { data: tgData } = useQuery({
    queryKey: tgRoute ? queryKeys.targetGroup(tgRoute.projectId, tgRoute.tgId) : ['tg-none'],
    queryFn: async () => {
      if (!tgRoute) return null
      const { data } = await api.get<TargetGroup>(
        `/projects/${tgRoute.projectId}/target-groups/${tgRoute.tgId}`
      )
      return data
    },
    enabled: !!tgRoute,
    staleTime: 30_000,
  })

  const appliedBaseCpi = tgData?.base_cpi ? formatCpi(tgData.base_cpi) : null
  const estimateCpi =
    canLookup && cpiResult?.cpi_amount ? formatCpi(cpiResult.cpi_amount) : '—'
  const amount = appliedBaseCpi ?? estimateCpi
  const bracket =
    canLookup && cpiResult?.loi_bracket && cpiResult?.ir_bracket
      ? `${cpiResult.loi_bracket} · ${cpiResult.ir_bracket}`
      : ''

  const cost =
    amount !== '—'
      ? formatCostKr(String(amount).replace(/[^\d.]/g, ''), inputs.completes_goal)
      : '—'

  const isTargetGroupRoute = !!tgRoute

  return (
    <div className="flex items-center gap-6">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-6 rounded-md px-2 py-1 hover:bg-secondary/60">
          <div className="flex items-center gap-2">
            <span className="pp-label">CPI</span>
            <span className="text-sm font-semibold text-primary">{amount}</span>
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
                  router.push(`${pathname}?rateCard=1`)
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
