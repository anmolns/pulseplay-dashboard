'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layers, Pencil, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { TGProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileLibrary } from '@/components/profiles/ProfileLibrary'
import {
  ConditionEditor,
  formatConditionSummary,
} from '@/components/profiles/ConditionEditor'
import { Badge } from '@/components/ui/badge'
interface TGProfilingTabProps {
  projectId: string
  tgId: string
}

export function TGProfilingTab({ projectId, tgId }: TGProfilingTabProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editingProfile, setEditingProfile] = useState<TGProfile | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const { data: profiles, isLoading, isError } = useQuery({
    queryKey: queryKeys.profiles(projectId, tgId),
    queryFn: async () => {
      const { data } = await api.get<TGProfile[]>(
        `/projects/${projectId}/target-groups/${tgId}/profiles`
      )
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      await api.delete(
        `/projects/${projectId}/target-groups/${tgId}/profiles/${profileId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles(projectId, tgId),
      })
      toast({ title: 'Profile removed' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const invalidateProfiles = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.profiles(projectId, tgId),
    })
  }

  const appliedAttributeIds = new Set(profiles?.map((p) => p.attribute_id) ?? [])

  const getTitle = (p: TGProfile) =>
    p.attribute.translations?.find((t) => t.language_code === 'en')?.question_text ??
    p.attribute.code

  const count = profiles?.length ?? 0

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Applied profiles</h3>
              <p className="text-xs text-muted-foreground">Targeting on this target group</p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {count} active
          </Badge>
        </div>

        <div className="space-y-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          {isError && (
            <p className="text-sm text-red-400">Failed to load profiles.</p>
          )}
          {profiles?.map((profile) => (
            <div
              key={profile.id}
              className="group rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {getTitle(profile)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="rounded-md text-[10px]">
                      {profile.attribute.category}
                    </Badge>
                    <Badge variant="outline" className="rounded-md text-[10px]">
                      {profile.attribute.response_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm text-foreground">
                    {formatConditionSummary(profile)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 border-border bg-secondary/40 px-0 hover:bg-secondary"
                    onClick={() => {
                      setEditingProfile(profile)
                      setEditorOpen(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 border-red-500/30 px-0 text-red-400 hover:bg-red-500/10"
                    onClick={() => {
                      const ok = window.confirm('Remove this profile from the target group?')
                      if (!ok) return
                      deleteMutation.mutate(profile.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {profiles?.length === 0 && !isLoading && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-12 text-center">
              <Layers className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 font-medium text-foreground">No criteria yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add attributes from the library →
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3">
        <ProfileLibrary
          projectId={projectId}
          tgId={tgId}
          onAdded={invalidateProfiles}
          appliedAttributeIds={appliedAttributeIds}
        />
      </div>

      <ConditionEditor
        projectId={projectId}
        tgId={tgId}
        profile={editingProfile}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={invalidateProfiles}
      />
    </div>
  )
}
