import dynamic from 'next/dynamic'

const ProjectsPageClient = dynamic(() => import('./ProjectsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
      Loading...
    </div>
  ),
})

export default function ProjectsPage() {
  return <ProjectsPageClient />
}
