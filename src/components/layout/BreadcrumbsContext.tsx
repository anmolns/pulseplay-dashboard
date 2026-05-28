'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type BreadcrumbItem = { label: string; href?: string }

type BreadcrumbsContextValue = {
  items: BreadcrumbItem[]
  set: (items: BreadcrumbItem[]) => void
  clear: () => void
}

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null)

export function BreadcrumbsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<BreadcrumbsContextValue>(
    () => ({
      items,
      set: setItems,
      clear,
    }),
    [items, clear]
  )

  return (
    <BreadcrumbsContext.Provider value={value}>
      {children}
    </BreadcrumbsContext.Provider>
  )
}

export function useBreadcrumbs() {
  const ctx = useContext(BreadcrumbsContext)
  if (!ctx) throw new Error('useBreadcrumbs must be used within BreadcrumbsProvider')
  return ctx
}

