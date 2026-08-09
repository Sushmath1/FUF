'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FloorPlan } from '@/components/map/FloorPlan'

// CRITICAL: ssr:false — Leaflet crashes on server
const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 380, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
      Loading map...
    </div>
  ),
})

type Venue = {
  id: string
  name: string
  floor?: number | null
  xPercent?: number | null
  yPercent?: number | null
  lat?: number | null
  lng?: number | null
  capacity?: number | null
}

type Building = {
  id: string
  name: string
  shortName?: string | null
  lat?: number | null
  lng?: number | null
  floorPlanUrl?: string | null
  entranceXPercent?: number | null
  entranceYPercent?: number | null
  floors: number
  currentEventName?: string | null
  venues: Venue[]
}

type CollegeMap = {
  id: string
  name: string
  festName: string
  mapImageUrl?: string | null
  mainGateLat?: number | null
  mainGateLng?: number | null
  buildings: Building[]
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  surfaceColor?: string | null
  fontStyle?: string | null
  moodText?: string | null
  particleStyle?: string | null
}

export function VisitorMapClient() {
  const searchParams = useSearchParams()
  const collegeId = searchParams.get('collegeId') ?? ''
  const preselectedVenueId = searchParams.get('venueId')

  const [college, setCollege] = useState<CollegeMap | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(preselectedVenueId)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const error = collegeId ? fetchError : 'College ID missing'

  useEffect(() => {
    if (!collegeId) {
      setLoading(false)
      return
    }

    fetch(`/api/colleges/${collegeId}`)
      .then(async (response) => {
        const data = (await response.json()) as CollegeMap | { error?: string }
        if (!response.ok) throw new Error((data as { error?: string }).error ?? 'Could not load map')
        return data as CollegeMap
      })
      .then((data) => {
        setCollege(data)
        if (preselectedVenueId) {
          for (const b of data.buildings ?? []) {
            if (b.venues?.find((v) => v.id === preselectedVenueId)) {
              setSelectedBuildingId(b.id)
              break
            }
          }
        }
      })
      .catch((loadError) => setFetchError(loadError instanceof Error ? loadError.message : 'Could not load map'))
      .finally(() => setLoading(false))
  }, [collegeId, preselectedVenueId])

  const buildings = useMemo(
    () => (college?.buildings ?? []).filter((b): b is Building & { lat: number; lng: number } => typeof b.lat === 'number' && typeof b.lng === 'number'),
    [college],
  )

  const selectedBuilding = college?.buildings.find((b) => b.id === selectedBuildingId)

  const rooms = useMemo(() => {
    if (!selectedBuilding) return []
    return (selectedBuilding.venues ?? [])
      .filter((v) => v.xPercent != null && v.yPercent != null)
      .filter((v) => !search || v.name.toLowerCase().includes(search.toLowerCase()))
      .map((v) => ({ id: v.id, name: v.name, xPercent: v.xPercent as number, yPercent: v.yPercent as number }))
  }, [selectedBuilding, search])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  if (error || !college) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <p style={{ color: '#ef4444' }}>{error || 'College not found'}</p>
      </main>
    )
  }

  return (
    <ThemeProvider
      primaryColor={college.primaryColor}
      secondaryColor={college.secondaryColor}
      accentColor={college.accentColor}
      bgColor={college.bgColor}
      surfaceColor={college.surfaceColor}
      fontStyle={college.fontStyle}
      moodText={college.moodText}
      particleStyle={college.particleStyle}
    >
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative' }}>
        <ParticleBackground style={(college.particleStyle as 'dots') ?? 'dots'} />
        <Navbar role="visitor" />

        <section style={{ width: 'min(800px, 100%)', margin: '0 auto', padding: '90px 20px 40px', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{college.name} Campus</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Tap a building to see indoor navigation</p>

            {buildings.length > 0 ? (
              <CampusMap
                buildings={buildings.map((b) => ({
                  id: b.id,
                  name: b.name,
                  shortName: b.shortName,
                  lat: b.lat,
                  lng: b.lng,
                  currentEventName: b.currentEventName,
                }))}
                center={[college.mainGateLat ?? buildings[0]?.lat ?? 13.0827, college.mainGateLng ?? buildings[0]?.lng ?? 80.2707]}
                selectedBuildingId={selectedBuildingId ?? undefined}
                mainGateLat={college.mainGateLat}
                mainGateLng={college.mainGateLng}
                onBuildingSelect={setSelectedBuildingId}
              />
            ) : (
              <div style={{ height: 200, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Campus map not configured yet
              </div>
            )}

            {(college.buildings ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {college.buildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBuildingId(b.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, border: '1px solid',
                      borderColor: selectedBuildingId === b.id ? 'var(--primary)' : 'var(--border)',
                      background: selectedBuildingId === b.id ? 'var(--glow)' : 'transparent',
                      color: selectedBuildingId === b.id ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}
                  >
                    {b.shortName ?? b.name}
                  </button>
                ))}
              </div>
            )}

            {selectedBuilding?.floorPlanUrl && (
              <motion.div key={selectedBuildingId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedBuilding.name} — Floor plan</h2>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search room..."
                    style={{ width: 140, padding: '6px 12px', fontSize: 13 }}
                  />
                </div>
                <FloorPlan
                  floorPlanUrl={selectedBuilding.floorPlanUrl}
                  rooms={rooms}
                  selectedRoomId={selectedVenueId ?? undefined}
                  entranceXPercent={selectedBuilding.entranceXPercent ?? 50}
                  entranceYPercent={selectedBuilding.entranceYPercent ?? 92}
                  onRoomSelect={setSelectedVenueId}
                />
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>
    </ThemeProvider>
  )
}
