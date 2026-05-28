'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { OrgUser } from '@/types'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[]
  user?: OrgUser
}

export function Header({ breadcrumbs, user }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <nav className="flex items-center gap-1 text-sm text-slate-600">
        {breadcrumbs.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-indigo-100 text-xs font-semibold text-indigo-700">
            {user?.display_code ?? '??'}
          </AvatarFallback>
        </Avatar>
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
      </div>
    </header>
  )
}
