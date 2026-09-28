'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { COLLEGE_ID_KEY } from '@/lib/guestSession'
import { Navbar } from '@/components/Navbar'
import { CollegeSearchPicker, type SearchCollege } from '@/components/CollegeSearchPicker'
import { ParticleBackground } from '@/components/ParticleBackground'

type Building = {
  id: string
  name: string
  shortName?: string | null
}

type CollegeMap = {
  id: string
  name: string
  festName: string
  mapImageUrl?: string | null
  buildings: Building[]
  venues: Array<{ id: string; name: string }>
}

export function VisitorMapClient() {
  const searchParams = useSearchParams()
  const collegeIdFromUrl = searchParams.get('collegeId') ?? ''

  // A visitor should never be asked for a college id — if it's not in the URL (e.g.
  // they bookmarked /visitor/map or a stale link), fall back to the college they
  // last actually interacted with (saved on verify and on schedule load), and only
  // show the picker below if we truly have no idea which college they mean.
  const [collegeId, setCollegeId] = useState(collegeIdFromUrl)

  useEffect(() => {
    if (collegeIdFromUrl) {
      setCollegeId(collegeIdFromUrl)
      return
    }
    const stored = localStorage.getItem(COLLEGE_ID_KEY)
    if (stored) setCollegeId(stored)
  }, [collegeIdFromUrl])

  const [college, setCollege] = useState<CollegeMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!collegeId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/colleges/${collegeId}`)
        const data = (await response.json()) as CollegeMap | { error?: string }
        if (!response.ok) throw new Error((data as { error?: string }).error ?? 'Could not load map')
        setCollege(data as CollegeMap)
        localStorage.setItem(COLLEGE_ID_KEY, collegeId)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load map')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [collegeId])

  const handlePicked = (picked: SearchCollege) => {
    localStorage.setItem(COLLEGE_ID_KEY, picked.id)
    setCollegeId(picked.id)
  }

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

        {!loading && !collegeId && (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>Which fest are you at?</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Search your college to load its campus map.
            </p>
            <CollegeSearchPicker onSelect={handlePicked} />
          </>
        )}

        {!loading && collegeId && error && <p style={{ color: '#ef4444' }}>{error}</p>}

        {college && (
          <>
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>{college.festName} campus map</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>{college.name}</p>

            {college.mapImageUrl ? (
              <div className="card" style={{ padding: 10, marginBottom: 12 }}>
                <img
                  src={college.mapImageUrl}
                  alt="Campus map"
                  style={{ width: '100%', borderRadius: 10, maxHeight: 420, objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <p style={{ color: 'var(--text-muted)' }}>This fest hasn&apos;t uploaded a campus image yet.</p>
              </div>
            )}

            {college.buildings.length > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Buildings</h2>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 6 }}>
                  {college.buildings.map((building) => (
                    <li key={building.id} style={{ color: 'var(--text-muted)' }}>
                      {building.name}
                      {building.shortName ? ` (${building.shortName})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
