import dynamic from 'next/dynamic'

const ProjectDetailPageClient = dynamic(() => import('./ProjectDetailPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      Loading...
    </div>
  ),
})

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <ProjectDetailPageClient id={params.id} />
}
