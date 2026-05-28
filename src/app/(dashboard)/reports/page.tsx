import dynamic from 'next/dynamic'

const ReportsPageClient = dynamic(() => import('./ReportsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
      Loading...
    </div>
  ),
})

export default function ReportsPage() {
  return <ReportsPageClient />
}
