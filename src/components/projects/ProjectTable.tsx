'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Search, SlidersHorizontal, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProgressMetric } from '@/components/ui/progress-metric'
import { projectStatusClass } from '@/lib/status-styles'
import { formatDateTime } from '@/lib/utils'
import type { Project } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
interface ProjectTableProps {
  projects?: Project[]
  isLoading: boolean
  isError: boolean
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
      <div className="space-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-border px-4 py-6">
            <Skeleton className="mb-2 h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-red-600">
        Failed to load projects. Please try again.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, or customer reference number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 border-border bg-card pr-10 shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-10 gap-2 bg-card shadow-sm">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-[1fr_160px_140px_140px_40px] gap-4 border-b border-border bg-secondary/40 px-6 py-3">
          <span className="pp-label">Project</span>
          <span className="pp-label">Last activity</span>
          <span className="pp-label">Target groups</span>
          <span className="pp-label">Status</span>
          <span />
        </div>

        {filtered.map((project) => (
          <button
            key={project.id}
            type="button"
            className="pp-data-row grid w-full grid-cols-[1fr_160px_140px_140px_40px] items-center gap-4 px-6 text-left"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <div className="flex min-w-0 items-start gap-3">
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{project.name}</span>
                  <StatusBadge
                    label={project.status}
                    className={projectStatusClass(project.status)}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {project.short_code}
                  {project.customer_ref_number && (
                    <> · {project.customer_ref_number}</>
                  )}
                </p>
              </div>
            </div>

            <span className="text-sm text-muted-foreground">
              {formatDateTime(project.last_activity_at)}
            </span>

            <ProgressMetric
              current={project.target_group_count}
              target={Math.max(project.target_group_count, 10)}
            />

            <span className="text-sm capitalize text-muted-foreground">
              {project.status}
            </span>

            <BarChart3 className="h-4 w-4 justify-self-end text-muted-foreground/50" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Try a different search term.' : 'Create your first project to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
