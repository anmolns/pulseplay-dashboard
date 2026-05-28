'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { CpiCalculatorWidget } from '@/components/pricing/CpiCalculatorWidget'

export function TopHeader() {
  const { data: user } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-end gap-5 px-8">
        <CpiCalculatorWidget />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-brand-light text-xs font-semibold text-primary">
            {user?.display_code ?? '??'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

