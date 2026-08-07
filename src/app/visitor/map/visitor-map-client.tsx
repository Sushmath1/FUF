'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

type Building = {
  id: string
  name: string
  shortName?: string | null
  lat?: number | null
  lng?: number | null
  venues: Array<{ id: string; name: string; lat?: number | null; lng?: number | null }>
}

type CollegeMap = {
  id: string
  name: string
  festName: string
  mapImageUrl?: string | null
  mainGateLat?: number | null
  mainGateLng?: number | null
  buildings: Building[]
}

const CampusMap = dynamic(() => import('./viewer').then((module) => module.CampusMapViewer), {
  ssr: false,
})

export function VisitorMapClient() {
  const searchParams = useSearchParams()
  const collegeId = searchParams.get('collegeId') ?? ''

  const [college, setCollege] = useState<CollegeMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!collegeId) {
        setError('College ID missing')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/colleges/${collegeId}`)
        const data = (await response.json()) as CollegeMap | { error?: string }
        if (!response.ok) throw new Error((data as { error?: string }).error ?? 'Could not load map')
        setCollege(data as CollegeMap)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load map')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [collegeId])

  const markers = useMemo(() => {
    const points: Array<{ label: string; lat: number; lng: number }> = []

    if (college?.mainGateLat && college?.mainGateLng) {
      points.push({ label: 'Main Gate', lat: college.mainGateLat, lng: college.mainGateLng })
    }

    for (const building of college?.buildings ?? []) {
      if (typeof building.lat === 'number' && typeof building.lng === 'number') {
        points.push({ label: building.shortName ?? building.name, lat: building.lat, lng: building.lng })
      }

      for (const venue of building.venues) {
        if (typeof venue.lat === 'number' && typeof venue.lng === 'number') {
          points.push({ label: venue.name, lat: venue.lat, lng: venue.lng })
        }
      }
    }

    return points
  }, [college])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative' }}>
      <ParticleBackground />
      <Navbar role="visitor" />

      <section
        style={{
          width: 'min(980px, 100%)',
          margin: '0 auto',
          padding: '90px 20px 30px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {loading && <span className="spinner" style={{ color: 'var(--primary)' }} />}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        {college && (
          <>
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>{college.festName} campus map</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>{college.name}</p>

            {college.mapImageUrl && (
              <div className="card" style={{ padding: 10, marginBottom: 12 }}>
                <img
                  src={college.mapImageUrl}
                  alt="Campus map"
                  style={{ width: '100%', borderRadius: 10, maxHeight: 420, objectFit: 'cover' }}
                />
              </div>
            )}

            <div className="card" style={{ padding: 10 }}>
              <CampusMap points={markers} />
            </div>
          </>
        )}
      </section>
    </main>
  )
}
