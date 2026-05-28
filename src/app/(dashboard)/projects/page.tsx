import dynamic from 'next/dynamic'

const ProjectsPageClient = dynamic(() => import('./ProjectsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      Loading...
    </div>
  ),
})

export default function ProjectsPage() {
  return <ProjectsPageClient />
}
