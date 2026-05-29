'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const TargetGroupDetailPageClient = dynamic(
  () => import('./TargetGroupDetailPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    ),
  }
)

export default function TargetGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string; tgId: string }>
}) {
  const { id, tgId } = use(params)
  return (
    <TargetGroupDetailPageClient projectId={id} tgId={tgId} />
  )
}
