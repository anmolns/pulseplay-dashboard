'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type CpiCalcInputs = {
  country_code?: string
  loi_minutes?: number
  ir_pct?: number
  completes_goal?: number
}

type CpiCalcContextValue = {
  inputs: CpiCalcInputs
  setInputs: (next: CpiCalcInputs) => void
  clear: () => void
}

const CpiCalcContext = createContext<CpiCalcContextValue | null>(null)

export function CpiCalcProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<CpiCalcInputs>({})
  const setInputs = useCallback((next: CpiCalcInputs) => setInputsState(next), [])
  const clear = useCallback(() => setInputsState({}), [])

  const value = useMemo<CpiCalcContextValue>(
    () => ({
      inputs,
      setInputs,
      clear,
    }),
    [inputs, setInputs, clear]
  )

  return <CpiCalcContext.Provider value={value}>{children}</CpiCalcContext.Provider>
}

export function useCpiCalc() {
  const ctx = useContext(CpiCalcContext)
  if (!ctx) throw new Error('useCpiCalc must be used within CpiCalcProvider')
  return ctx
}

