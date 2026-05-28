'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { ProfileAttribute } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const CATEGORIES = [
  'All',
  'Demographics',
  'Employment',
  'Beverages',
  'Media & Technology',
  'Lifestyle',
  'Health',
  'Politics & Society',
  'Values',
  'Consumer Behaviour',
]

interface ProfileLibraryProps {
  projectId: string
  tgId: string
  onAdded: () => void
  appliedAttributeIds: Set<string>
}

export function ProfileLibrary({
  projectId,
  tgId,
  onAdded,
  appliedAttributeIds,
}: ProfileLibraryProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.profileLibrary(
      category === 'All' ? undefined : category,
      debouncedSearch || undefined
    ),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category !== 'All') params.set('category', category)
      if (debouncedSearch) params.set('search', debouncedSearch)
      const qs = params.toString()
      const { data } = await api.get<ProfileAttribute[]>(
        `/profile-library${qs ? `?${qs}` : ''}`
      )
      return data
    },
  })

  const addMutation = useMutation({
    mutationFn: async (attributeId: string) => {
      await api.post(`/projects/${projectId}/target-groups/${tgId}/profiles`, {
        attribute_id: attributeId,
        quotas_enabled: false,
        sort_order: 0,
      })
      return attributeId
    },
    onSuccess: () => {
      onAdded()
      toast({ title: 'Profile added' })
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  return (
    <Card className="h-full border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base text-[hsl(276,45%,28%)]">Profile Library</CardTitle>
        <div className="flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search..."
              className="h-10 border-border bg-white pl-8 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v ?? 'All')}>
            <SelectTrigger className="h-10 w-[180px] border-border bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === 'All' ? 'Category' : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="max-h-[520px] space-y-2 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        {isError && (
          <p className="text-sm text-red-600">Failed to load profile library.</p>
        )}
        {data?.map((attr) => (
          <div
            key={attr.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-light px-2 py-0.5 text-xs font-semibold text-primary">
                  {attr.code}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {attr.code}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5">
                  {attr.category}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  {attr.response_type}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-brand-light"
              disabled={addMutation.isPending || appliedAttributeIds.has(attr.id)}
              onClick={() => addMutation.mutate(attr.id)}
            >
              {appliedAttributeIds.has(attr.id) ? 'Added' : '+ Add'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
