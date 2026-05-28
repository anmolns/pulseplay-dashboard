'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { CpiCalcProvider } from '@/components/pricing/CpiCalcContext'
import { BreadcrumbsProvider } from '@/components/layout/BreadcrumbsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BreadcrumbsProvider>
        <CpiCalcProvider>{children}</CpiCalcProvider>
      </BreadcrumbsProvider>
    </QueryClientProvider>
  )
}
