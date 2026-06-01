'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'profiling', label: 'Profiling' },
  { value: 'performance', label: 'Performance' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'changelog', label: 'Changelog' },
] as const

export function TGTabNav() {
  return (
    <TabsList
      variant="line"
      className="mb-0 h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
    >
      {TABS.map(({ value, label }) => (
        <TabsTrigger
          key={value}
          value={value}
          className={cn(
            'relative rounded-none border-0 bg-transparent px-5 py-3.5 text-sm font-medium shadow-none',
            'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
            'data-active:bg-transparent data-active:text-primary data-active:shadow-none',
            'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full',
            'after:bg-primary after:opacity-0 after:transition-opacity',
            'data-active:after:opacity-100'
          )}
        >
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
