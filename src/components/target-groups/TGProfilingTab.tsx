'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
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

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground">Applied Profiles</h3>
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        {isError && (
          <p className="text-sm text-red-600">Failed to load profiles.</p>
        )}
        {profiles?.map((profile) => (
          <div
            key={profile.id}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {getTitle(profile)}
                  </p>
                  <Badge variant="secondary" className="rounded-full">
                    {profile.attribute.category}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {profile.attribute.response_type}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatConditionSummary(profile)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 px-0"
                  onClick={() => {
                    setEditingProfile(profile)
                    setEditorOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 px-0 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    const ok = window.confirm('Remove this profile from the target group?')
                    if (!ok) return
                    deleteMutation.mutate(profile.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {profiles?.length === 0 && !isLoading && (
          <div className="rounded-xl border border-border bg-card px-5 py-10 text-center shadow-card">
            <p className="font-medium text-foreground">
              No profiling criteria added yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the library on the right to add attributes.
            </p>
          </div>
        )}
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
