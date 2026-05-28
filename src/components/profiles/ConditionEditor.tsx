'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/hooks/use-toast'
import type { ProfileAttribute, TGProfile } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface ConditionEditorProps {
  projectId: string
  tgId: string
  profile: TGProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function getOptionLabel(
  opt: {
    code: string
    translations: { language_code: string; label: string }[]
  },
  lang = 'en'
) {
  return (
    opt.translations.find((t) => t.language_code === lang)?.label ??
    opt.translations[0]?.label ??
    opt.code
  )
}

export function ConditionEditor({
  projectId,
  tgId,
  profile,
  open,
  onOpenChange,
  onSaved,
}: ConditionEditorProps) {
  const { toast } = useToast()
  const [rangeMin, setRangeMin] = useState('')
  const [rangeMax, setRangeMax] = useState('')
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())

  const attributeId = profile?.attribute_id

  const { data: attribute, isLoading } = useQuery({
    queryKey: queryKeys.profileAttribute(attributeId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ProfileAttribute>(
        `/profile-library/${attributeId}`
      )
      return data
    },
    enabled: !!attributeId && open,
  })

  useEffect(() => {
    if (!profile || !open) return
    if (profile.attribute.response_type === 'range') {
      const c = profile.conditions[0]
      setRangeMin(String(c?.range_min ?? ''))
      setRangeMax(String(c?.range_max ?? ''))
      setSelectedOption('')
      setSelectedOptions(new Set())
    } else if (profile.attribute.response_type === 'single_punch') {
      const first = profile.conditions[0]?.option_id ?? ''
      setSelectedOption(first || '')
      setSelectedOptions(new Set())
    } else {
      setSelectedOptions(
        new Set(profile.conditions.map((c) => c.option_id).filter(Boolean) as string[])
      )
      setSelectedOption('')
    }
  }, [profile, open])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return
      let conditions: Record<string, unknown>[] = []
      if (attribute?.response_type === 'range') {
        conditions = [
          { range_min: Number(rangeMin), range_max: Number(rangeMax) },
        ]
      } else if (attribute?.response_type === 'single_punch') {
        conditions = selectedOption ? [{ option_id: selectedOption }] : []
      } else {
        conditions = Array.from(selectedOptions).map((option_id) => ({
          option_id,
        }))
      }
      await api.put(
        `/projects/${projectId}/target-groups/${tgId}/profiles/${profile.id}/conditions`,
        { conditions }
      )
    },
    onSuccess: () => {
      toast({ title: 'Conditions saved' })
      onSaved()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const responseType = attribute?.response_type ?? profile?.attribute.response_type
  const title =
    attribute?.translations?.find((t) => t.language_code === 'en')?.question_text ??
    profile?.attribute.translations?.find((t) => t.language_code === 'en')?.question_text ??
    profile?.attribute.code

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-[hsl(276,45%,28%)]">{title}</DialogTitle>
        </DialogHeader>

        {isLoading && <Skeleton className="h-24 w-full" />}

        {!isLoading && responseType === 'range' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="pp-label">Min</Label>
              <Input
                type="number"
                className="h-11 border-border bg-white shadow-sm"
                value={rangeMin}
                onChange={(e) => setRangeMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="pp-label">Max</Label>
              <Input
                type="number"
                className="h-11 border-border bg-white shadow-sm"
                value={rangeMax}
                onChange={(e) => setRangeMax(e.target.value)}
              />
            </div>
          </div>
        )}

        {!isLoading &&
          responseType === 'single_punch' && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {attribute?.options?.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-brand-light/40"
                >
                  <input
                    type="radio"
                    name="pp_single_punch"
                    checked={selectedOption === opt.id}
                    onChange={() => setSelectedOption(opt.id)}
                    className="h-4 w-4 accent-[hsl(var(--brand))]"
                  />
                  <span className="text-sm">{getOptionLabel(opt)}</span>
                </label>
              ))}
            </div>
          )}

        {!isLoading && responseType === 'multi_punch' && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {attribute?.options?.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-brand-light/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.has(opt.id)}
                    onChange={() => toggleOption(opt.id)}
                    className="h-4 w-4 rounded border-slate-300 accent-[hsl(var(--brand))]"
                  />
                  <span className="text-sm">{getOptionLabel(opt)}</span>
                </label>
              ))}
            </div>
          )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save Conditions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatConditionSummary(profile: TGProfile): string {
  const attr = profile.attribute
  if (attr.response_type === 'range' && profile.conditions[0]) {
    const c = profile.conditions[0]
    return `${c.range_min} – ${c.range_max}`
  }
  if (profile.conditions.length === 0) return 'No conditions'
  const labels = profile.conditions
    .map((c) => {
      const opt = attr.options?.find((o) => o.id === c.option_id)
      if (!opt) return null
      return (
        opt.translations.find((t) => t.language_code === 'en')?.label ??
        opt.translations[0]?.label
      )
    })
    .filter(Boolean)
  return labels.join(', ') || 'Configured'
}

export { formatConditionSummary }
