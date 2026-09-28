'use client'

import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { ThemeProvider } from '@/components/ThemeProvider'
import { COLLEGE_ID_KEY, getOrCreateGuestId } from '@/lib/guestSession'

type College = {
  id: string
  name: string
  shortName?: string | null
  festName: string
  festTagline?: string | null
  bannerUrl?: string | null
  moodText?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  surfaceColor?: string | null
  fontStyle?: string | null
  particleStyle?: string | null
}

type Event = {
  id: string
  name: string
  category: string
  venue: { name: string }
  startTime: string
}

type VerifiedEvent = {
  id: string
  name: string
}

const categoryIcons: Record<string, string> = {
  TECHNICAL: 'Code',
  CULTURAL: 'Art',
  SPORTS: 'Sport',
  WORKSHOP: 'Lab',
  GAMING: 'Game',
  MUSIC: 'Music',
  DANCE: 'Dance',
  FOOD: 'Food',
  OTHER: 'Event',
}

export default function VisitorCollegePage() {
  const params = useParams<{ id: string }>()
  const collegeId = params.id
  const { data: session } = useSession()

  const [college, setCollege] = useState<College | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ found: number; events: VerifiedEvent[]; message?: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [collegeRes, eventsRes] = await Promise.all([
          fetch(`/api/colleges/${collegeId}`),
          fetch(`/api/colleges/${collegeId}/events`),
        ])

        if (!collegeRes.ok) throw new Error('Could not load college details')

        const collegeData = (await collegeRes.json()) as College
        const eventsData = (await eventsRes.json()) as { events?: Event[] }
        setCollege(collegeData)
        setEvents(eventsData.events ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load data')
      }
    }

    void load()
  }, [collegeId])

  const grouped = useMemo(() => {
    return events.reduce<Record<string, Event[]>>((acc, event) => {
      const key = event.category || 'OTHER'
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {})
  }, [events])

  const verify = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Must match whichever identity the schedule page will look this registration up
      // by: a logged-in visitor's real account id, or their guest id otherwise. Always
      // sending guestSessionId here — even for a logged-in visitor — was the bug: the
      // registration would be saved under a guest id nothing on the schedule page ever
      // queries again once that visitor is signed in, so it looked like verification
      // silently did nothing.
      const submitVerify = async (identity: { visitorId: string } | { guestSessionId: string }) => {
        const response = await fetch('/api/visitors/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collegeId, email: email || undefined, phone: phone || undefined, ...identity }),
        })
        const data = (await response.json()) as { found?: number; events?: VerifiedEvent[]; error?: string; message?: string }
        return { response, data }
      }

      const visitorId = session?.user?.id
      let { response, data } = await submitVerify(visitorId ? { visitorId } : { guestSessionId: getOrCreateGuestId() })

      // This page must always work with zero login. A stale login cookie whose
      // account has since been deleted still resolves to a visitorId here, and the
      // API correctly rejects that id as invalid — but a guest browsing this page
      // never asked to log in, so silently retry as a guest instead of surfacing
      // that as a scary "session invalid" error.
      if (!response.ok && response.status === 401 && visitorId) {
        ;({ response, data } = await submitVerify({ guestSessionId: getOrCreateGuestId() }))
      }

      if (!response.ok) throw new Error(data.error ?? 'Verification failed')

      // So "Navigate to campus" on the schedule page never has to ask for a college
      // id — it's known the moment a visitor successfully verifies here.
      localStorage.setItem(COLLEGE_ID_KEY, collegeId)

      const found = data.found ?? 0
      const verifiedEvents = data.events ?? []
      setResult({ found, events: verifiedEvents, message: data.message })

      if (found > 0) {
        confetti({ particleCount: 100, spread: 70 })
        toast.success(`Found ${found} events`)
      }
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify registrations')
    } finally {
      setLoading(false)
    }
  }

  if (error && !college) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </main>
    )
  }

  if (!college) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  const primary = college.primaryColor ?? '#06b6d4'
  const secondary = college.secondaryColor ?? '#6366f1'

  return (
    <ThemeProvider {...college}>
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative', paddingBottom: 40 }}>
        <ParticleBackground />
        <Navbar />

        <section
          style={{
            marginTop: 60,
            minHeight: 260,
            background: college.bannerUrl
              ? `url(${college.bannerUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primary}, ${secondary})`,
            display: 'flex',
            alignItems: 'end',
            padding: '40px 20px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: college.bannerUrl ? 'rgba(2,6,23,0.5)' : 'transparent',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, width: 'min(980px, 100%)', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(36px, 7vw, 56px)', fontWeight: 900 }}>{college.festName}</h1>
            <p style={{ marginTop: 8, opacity: 0.9 }}>{college.moodText ?? 'Your fest. Your schedule.'}</p>
          </div>
        </section>

        <div style={{ width: 'min(980px, 100%)', margin: '0 auto', padding: '20px' }}>
          <motion.section
            className="card"
            style={{ padding: 24, marginTop: -48, position: 'relative', zIndex: 2 }}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Find my registered events</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Enter your email or phone number.</p>

            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" />
            </div>

            <button className="btn-primary" style={{ marginTop: 16 }} onClick={verify} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Checking registrations...
                </>
              ) : (
                'Find my events'
              )}
            </button>

            {error && <p style={{ marginTop: 12, color: '#ef4444' }}>{error}</p>}

            {result && result.found > 0 && (
              <div className="card" style={{ marginTop: 16, padding: 16, borderColor: 'var(--accent)' }}>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>Found {result.found} events</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                  {result.events.map((event) => event.name).join(', ')}
                </p>
                <Link href="/visitor/schedule" className="btn-outline" style={{ textDecoration: 'none' }}>
                  View my schedule
                </Link>
              </div>
            )}

            {result && result.found === 0 && (
              <div className="card" style={{ marginTop: 16, padding: 16, borderColor: '#f59e0b' }}>
                <p style={{ color: '#fbbf24', fontWeight: 700 }}>No registrations found</p>
                <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                  {result.message ?? 'Try another email or phone number used during registration.'}
                </p>
              </div>
            )}
          </motion.section>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Public event list</h2>

            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No events published yet.</p>
            ) : (
              Object.entries(grouped).map(([category, categoryEvents]) => (
                <div key={category} style={{ marginBottom: 18 }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: 8, fontWeight: 800 }}>
                    {categoryIcons[category] ?? 'Event'} {category}
                  </h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {categoryEvents.map((event) => (
                      <article key={event.id} className="card" style={{ padding: 14 }}>
                        <p style={{ fontWeight: 700 }}>{event.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                          {new Date(event.startTime).toLocaleString('en-IN')} | {event.venue.name}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </ThemeProvider>
  )
}
