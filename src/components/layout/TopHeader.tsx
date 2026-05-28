'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { CpiCalculatorWidget } from '@/components/pricing/CpiCalculatorWidget'
import Link from 'next/link'
import { ChevronRight, Folder } from 'lucide-react'
import { useBreadcrumbs } from './BreadcrumbsContext'

export function TopHeader() {
  const { data: user } = useAuth()
  const { items } = useBreadcrumbs()

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-5 px-8">
        <div className="min-w-0">
          {items.length > 0 ? (
            <nav className="flex min-w-0 items-center gap-1.5 text-sm">
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              {items.map((item, i) => (
                <span key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="truncate text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-foreground">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            <span className="text-sm font-medium text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center justify-end gap-5">
          <CpiCalculatorWidget />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-brand-light text-xs font-semibold text-primary">
            {user?.display_code ?? '??'}
          </AvatarFallback>
        </Avatar>
        </div>
      </div>
    </header>
  )
}

