'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { OrgUser } from '@/types'

export function useAuth() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const { data } = await api.get<OrgUser>('/auth/me')
      return data
    },
    retry: false,
  })
}

export function getStoredBusinessUnitId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('pp_bu_id')
}

export function setStoredBusinessUnitId(id: string) {
  localStorage.setItem('pp_bu_id', id)
}
