'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProgressMetric } from '@/components/ui/progress-metric'
import { projectStatusClass } from '@/lib/status-styles'
import { formatDateTime } from '@/lib/utils'
import type { Project } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProjectTableProps {
  projects?: Project[]
  isLoading: boolean
  isError: boolean
}

function projectInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function ProjectTable({ projects, isLoading, isError }: ProjectTableProps) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!projects) return []
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short_code.toLowerCase().includes(q) ||
        p.customer_ref_number?.toLowerCase().includes(q)
    )
  }, [projects, search])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
        <p className="text-sm font-medium text-red-400">Failed to load projects</p>
        <p className="mt-1 text-xs text-muted-foreground">Please refresh the page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, code, or customer ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-border bg-secondary/40 pl-10"
            />
          </div>
          <Button variant="outline" className="h-11 gap-2 border-border bg-secondary/40">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-[1fr_150px_130px_40px] gap-4 border-b border-border bg-secondary/40 px-5 py-3 max-lg:grid-cols-[1fr_40px]">
          <span className="pp-label">Project</span>
          <span className="pp-label max-lg:hidden">Last activity</span>
          <span className="pp-label max-lg:hidden">Target groups</span>
          <span />
        </div>

        {filtered.map((project) => (
          <button
            key={project.id}
            type="button"
            className={cn(
              'group grid w-full grid-cols-[1fr_150px_130px_40px] items-center gap-4 border-b border-border/60 px-5 py-4 text-left transition-colors',
              'last:border-0 hover:bg-primary/5 hover:pl-6 max-lg:grid-cols-[1fr_40px]',
              project.status === 'active' && 'border-l-2 border-l-primary/50'
            )}
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                {projectInitials(project.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground group-hover:text-primary">
                    {project.name}
                  </span>
                  <StatusBadge
                    label={project.status}
                    className={projectStatusClass(project.status)}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <span className="font-mono">{project.short_code}</span>
                  {project.customer_ref_number && (
                    <> · Ref {project.customer_ref_number}</>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
                  {formatDateTime(project.last_activity_at)} · {project.target_group_count} TGs
                </p>
              </div>
            </div>

            <span className="text-sm text-muted-foreground max-lg:hidden">
              {project.last_activity_at ? formatDateTime(project.last_activity_at) : '—'}
            </span>

            <div className="max-lg:hidden">
              <ProgressMetric
                current={project.target_group_count}
                target={Math.max(project.target_group_count, 10)}
              />
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-medium text-foreground">No projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Try a different search term.' : 'Create your first project to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
