'use client'

import dynamic from 'next/dynamic'

const ReportsPageClient = dynamic(() => import('./ReportsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      Loading...
    </div>
  ),
})

export default function ReportsPage() {
  return <ReportsPageClient />
}
