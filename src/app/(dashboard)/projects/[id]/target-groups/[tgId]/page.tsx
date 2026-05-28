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
  params: { id: string; tgId: string }
}) {
  return (
    <TargetGroupDetailPageClient projectId={params.id} tgId={params.tgId} />
  )
}
