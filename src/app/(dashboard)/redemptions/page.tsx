'use client'

import dynamic from 'next/dynamic'

const RedemptionsPageClient = dynamic(() => import('./RedemptionsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      Loading...
    </div>
  ),
})

export default function RedemptionsPage() {
  return <RedemptionsPageClient />
}
