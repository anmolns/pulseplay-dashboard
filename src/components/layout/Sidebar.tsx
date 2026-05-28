'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  FolderKanban,
  FileBarChart,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgUser } from '@/types'
import logo from '@/assets/logo.png'

const navItems = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
]

interface SidebarProps {
  user?: OrgUser
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('pp_token')
    localStorage.removeItem('pp_bu_id')
    router.push('/login')
  }

  const initials = user?.display_code ?? '??'

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-start pl-1 pr-3 py-3">
        <Link href="/projects" className="block w-[220px] max-w-full">
          <Image
            src={logo}
            alt="PulsePlay"
            className="h-auto w-full object-contain object-left"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-light text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-[18px] w-[18px]', active && 'text-primary')}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <button
          type="button"
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </button>

        <div className="flex items-center gap-3 rounded-lg bg-secondary/60 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.full_name ?? 'Loading...'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Inqvita AB
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
