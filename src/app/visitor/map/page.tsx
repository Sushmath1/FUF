import { Suspense } from 'react'

import { VisitorMapClient } from './visitor-map-client'

export default function VisitorMapPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <span className="spinner" style={{ color: 'var(--primary)' }} />
        </main>
      }
    >
      <VisitorMapClient />
    </Suspense>
  )
}
