'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'
import { ThemePicker } from '@/components/ThemePicker'
import { ThemeProvider } from '@/components/ThemeProvider'
import { PRESET_THEMES, type PresetTheme } from '@/lib/presetThemes'

type Venue = { id: string; name: string; building?: { name: string } | null }

type Event = {
  id: string
  name: string
  category: string
  venueId: string
  venue: { name: string; building?: { name?: string | null } | null }
  startTime: string
  endTime: string
  status: 'SCHEDULED' | 'CHANGED' | 'CANCELLED'
}

type College = {
  id: string
  festName: string
  name: string
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  surfaceColor?: string | null
  fontStyle?: string | null
  moodText?: string | null
  particleStyle?: string | null
  themeDescription?: string | null
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

export default function CollegeDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [college, setCollege] = useState<College | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flashIds, setFlashIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Event | null>(null)
  const [stats, setStats] = useState({ eventsToday: 0, totalRegistrations: 0 })
  const [csvText, setCsvText] = useState('')
  const [uploadingCsv, setUploadingCsv] = useState(false)

  const [newEvent, setNewEvent] = useState({
    name: '',
    category: 'OTHER',
    venueId: '',
    startTime: '',
    endTime: '',
    contactName: '',
    contactNumber: '',
  })

  const currentThemeId = useMemo(
    () => PRESET_THEMES.find((preset) => preset.primaryColor === college?.primaryColor)?.id,
    [college?.primaryColor],
  )

  const isActiveFest = useMemo(() => {
    return events.some((event) => new Date(event.endTime) > new Date() && event.status !== 'CANCELLED')
  }, [events])

  const groupedByDay = useMemo(() => {
    const grouped: Record<string, Event[]> = {}
    for (const event of events) {
      const day = new Date(event.startTime).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(event)
    }
    return grouped
  }, [events])

  const loadData = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError('')

    try {
      const [collegeRes, eventsRes, venuesRes, statsRes] = await Promise.all([
        fetch(`/api/colleges/${session.user.id}`),
        fetch(`/api/colleges/${session.user.id}/events`),
        fetch(`/api/colleges/${session.user.id}/venues`),
        fetch(`/api/colleges/${session.user.id}/stats`),
      ])

      const collegeData = (await collegeRes.json()) as College | { error?: string }
      const eventsData = (await eventsRes.json()) as { events?: Event[]; error?: string }
      const venuesData = (await venuesRes.json()) as { venues?: Venue[]; error?: string }
      const statsData = (await statsRes.json()) as { eventsToday?: number; totalRegistrations?: number }

      if (!collegeRes.ok) throw new Error((collegeData as { error?: string }).error ?? 'Could not load college data')

      const finalCollege = collegeData as College
      setCollege(finalCollege)
      setEvents(eventsData.events ?? [])
      setVenues(venuesData.venues ?? [])
      setStats({
        eventsToday: statsData.eventsToday ?? 0,
        totalRegistrations: statsData.totalRegistrations ?? 0,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/college/login')
    }
  }, [router, status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'college') {
      router.push('/college/login')
    }
  }, [router, session?.user?.role, status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      void loadData()
    }
  }, [session?.user?.id, status])

  const flashCard = (id: string) => {
    setFlashIds((prev) => [...prev, id])
    setTimeout(() => setFlashIds((prev) => prev.filter((eventId) => eventId !== id)), 1200)
  }

  const patchEvent = async (eventId: string, payload: Record<string, unknown>) => {
    if (!session?.user?.id) return
    setSaving(eventId)

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Failed to update event')
      await loadData()
      flashCard(eventId)
      toast.success('Event updated')
    } catch (patchError) {
      toast.error(patchError instanceof Error ? patchError.message : 'Failed to update event')
    } finally {
      setSaving(null)
    }
  }

  const addEvent = async () => {
    if (!session?.user?.id) return

    setSaving('new')
    try {
      const response = await fetch(`/api/colleges/${session.user.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not create event')

      toast.success('Event created')
      setShowAdd(false)
      setNewEvent({
        name: '',
        category: 'OTHER',
        venueId: '',
        startTime: '',
        endTime: '',
        contactName: '',
        contactNumber: '',
      })
      await loadData()
    } catch (addError) {
      toast.error(addError instanceof Error ? addError.message : 'Could not create event')
    } finally {
      setSaving(null)
    }
  }

  const handleThemeChange = async (theme: PresetTheme) => {
    if (!session?.user?.id) return

    setSaving('theme')
    try {
      const response = await fetch(`/api/colleges/${session.user.id}/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeDescription: theme.name,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          bgColor: theme.bgColor,
          surfaceColor: theme.surfaceColor,
          fontStyle: theme.fontStyle,
          moodText: theme.moodText,
          particleStyle: theme.particleStyle,
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not save theme')
      toast.success('Theme updated!')
      await loadData()
    } catch (themeError) {
      toast.error(themeError instanceof Error ? themeError.message : 'Could not save theme')
    } finally {
      setSaving(null)
    }
  }

  const uploadCsv = async () => {
    if (!session?.user?.id || !csvText.trim()) return

    setUploadingCsv(true)

    try {
      const [header, ...rows] = csvText.trim().split(/\r?\n/)
      const columns = header.split(',').map((item) => item.trim().toLowerCase())
      const eventIndex = columns.indexOf('eventname')
      const emailIndex = columns.indexOf('email')
      const phoneIndex = columns.indexOf('phone')

      if (eventIndex === -1) throw new Error('CSV must contain eventName column')

      const entries = rows
        .map((row) => row.split(',').map((cell) => cell.trim()))
        .map((cells) => ({
          eventName: cells[eventIndex] ?? '',
          email: emailIndex >= 0 ? cells[emailIndex] : '',
          phone: phoneIndex >= 0 ? cells[phoneIndex] : '',
        }))

      const response = await fetch(`/api/colleges/${session.user.id}/preregistered`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })

      const data = (await response.json()) as { matched?: number; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Upload failed')

      toast.success(`Uploaded ${data.matched ?? 0} matched entries`)
      setCsvText('')
    } catch (csvError) {
      toast.error(csvError instanceof Error ? csvError.message : 'Upload failed')
    } finally {
      setUploadingCsv(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  return (
    <ThemeProvider {...(college ?? {})}>
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingBottom: 40 }}>
        <Navbar role="college" />

        <header
          style={{
            position: 'sticky',
            top: 60,
            zIndex: 50,
            backdropFilter: 'blur(12px)',
            background: 'rgba(var(--bg-rgb), 0.75)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ width: 'min(1180px, 100%)', margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 900 }}>{college?.festName}</h1>
              {isActiveFest && (
                <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', letterSpacing: 1.1 }}>LIVE</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                aria-label="Customize theme"
                title="Customize theme"
                onClick={() => setShowThemeModal(true)}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                ⚙️
              </button>
              <button
                className="btn-primary"
                style={{ padding: '16px 28px', fontSize: 16 }}
                onClick={() => setShowAdd((prev) => !prev)}
              >
                + Add event
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid" style={{ width: 'min(1180px, 100%)', margin: '0 auto', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 16 }}>
          <section>
            {error && <p style={{ color: '#ef4444', marginBottom: 10 }}>{error}</p>}

            {showAdd && (
              <div className="card" style={{ padding: 14, marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Create event</h3>
                {venues.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    No venues yet.{' '}
                    <Link href="/college/map-setup" style={{ color: 'var(--primary)' }}>
                      Add a building and venue first from Map Setup
                    </Link>
                    .
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                      <input value={newEvent.name} placeholder="Event name" onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
                      <select value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}>
                        {['TECHNICAL', 'CULTURAL', 'SPORTS', 'WORKSHOP', 'GAMING', 'MUSIC', 'DANCE', 'FOOD', 'OTHER'].map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      <select value={newEvent.venueId} onChange={(e) => setNewEvent({ ...newEvent, venueId: e.target.value })}>
                        <option value="">Select venue</option>
                        {venues.map((venue) => (
                          <option key={venue.id} value={venue.id}>{venue.name}</option>
                        ))}
                      </select>
                      <input type="datetime-local" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                      <input type="datetime-local" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                      <input value={newEvent.contactName} placeholder="Contact name" onChange={(e) => setNewEvent({ ...newEvent, contactName: e.target.value })} />
                      <input value={newEvent.contactNumber} placeholder="Contact number" onChange={(e) => setNewEvent({ ...newEvent, contactNumber: e.target.value })} />
                    </div>
                    <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void addEvent()} disabled={saving === 'new' || !newEvent.venueId}>
                      {saving === 'new' ? <><span className="spinner" /> Saving...</> : 'Save event'}
                    </button>
                  </>
                )}
              </div>
            )}

            {events.length === 0 ? (
              <div className="card" style={{ padding: 16 }}>No events yet - add your first event.</div>
            ) : (
              Object.entries(groupedByDay).map(([day, dayEvents]) => (
                <div key={day} style={{ marginBottom: 12 }}>
                  <h2 style={{ marginBottom: 8, color: 'var(--primary)', fontWeight: 800 }}>{day}</h2>
                  {dayEvents.map((event) => (
                    <motion.article
                      key={event.id}
                      className={`card ${flashIds.includes(event.id) ? 'flash' : ''}`}
                      style={{ padding: 12, marginBottom: 8 }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                            {categoryIcons[event.category] ?? 'Event'} {event.name}
                          </h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {event.venue.name} | {new Date(event.startTime).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <StatusBadge status={event.status} />
                      </div>

                      <div style={{ marginTop: 10, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                        <select
                          value={event.venueId}
                          onChange={(e) => void patchEvent(event.id, { venueId: e.target.value })}
                          disabled={saving === event.id}
                        >
                          {venues.map((venue) => (
                            <option key={venue.id} value={venue.id}>{venue.name}</option>
                          ))}
                        </select>

                        <input
                          type="datetime-local"
                          defaultValue={toDateTimeLocal(event.startTime)}
                          onBlur={(e) => {
                            if (e.target.value) {
                              void patchEvent(event.id, { startTime: new Date(e.target.value).toISOString() })
                            }
                          }}
                          disabled={saving === event.id}
                        />
                        <input
                          type="datetime-local"
                          defaultValue={toDateTimeLocal(event.endTime)}
                          onBlur={(e) => {
                            if (e.target.value) {
                              void patchEvent(event.id, { endTime: new Date(e.target.value).toISOString() })
                            }
                          }}
                          disabled={saving === event.id}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn-outline" disabled={saving === event.id} onClick={() => setCancelTarget(event)}>
                          Cancel
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ))
            )}
          </section>

          <aside className="dashboard-aside" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Upload attendee list</h3>
              <textarea
                rows={6}
                placeholder="Paste CSV data with headers: eventName,email,phone"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <button className="btn-outline" style={{ marginTop: 10, width: '100%' }} disabled={uploadingCsv || !csvText.trim()} onClick={() => void uploadCsv()}>
                {uploadingCsv ? <><span className="spinner" /> Uploading...</> : 'Upload CSV'}
              </button>
            </div>

            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Stats</h3>
              <p>Events today: {stats.eventsToday}</p>
              <p>Total registered visitors: {stats.totalRegistrations}</p>
            </div>

            <Link href="/college/map-setup" className="btn-outline" style={{ textDecoration: 'none' }}>
              Go to map setup
            </Link>
          </aside>
        </div>

        {showThemeModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,6,23,0.7)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 150,
              padding: 20,
            }}
            onClick={() => setShowThemeModal(false)}
          >
            <div
              className="card"
              style={{ width: 'min(480px, 100%)', padding: 24, maxHeight: '85vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-muted)' }}>
                  Customize theme
                </p>
                <button
                  aria-label="Close"
                  onClick={() => setShowThemeModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Current theme</p>
              <ThemeSwatches
                colors={[college?.primaryColor, college?.secondaryColor, college?.accentColor, college?.bgColor, college?.surfaceColor]}
              />
              {college?.moodText && (
                <p style={{ marginTop: 6, marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>{college.moodText}</p>
              )}

              <ThemePicker initialThemeId={currentThemeId} onSelect={(theme) => void handleThemeChange(theme)} />
              {saving === 'theme' && (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  <span className="spinner" /> Saving theme...
                </p>
              )}
            </div>
          </div>
        )}

        {cancelTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,6,23,0.7)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 150,
            }}
          >
            <div className="card" style={{ width: 'min(420px, 100%)', padding: 16 }}>
              <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Cancel this event?</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
                This will instantly notify all registered visitors.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" onClick={() => setCancelTarget(null)}>Keep event</button>
                <button
                  className="btn-primary"
                  style={{ background: '#ef4444', color: '#fff' }}
                  onClick={() => {
                    void patchEvent(cancelTarget.id, { status: 'CANCELLED' })
                    setCancelTarget(null)
                  }}
                >
                  Confirm cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
          }
          .dashboard-aside {
            justify-items: center;
            text-align: center;
          }
          .dashboard-aside .card {
            width: 100%;
          }
        }
      `}</style>
    </ThemeProvider>
  )
}

function ThemeSwatches({ colors }: { colors: Array<string | null | undefined> }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {colors.map((color, i) => (
        <span
          key={i}
          style={{ width: 28, height: 28, borderRadius: 6, background: color ?? 'var(--surface2)', border: '1px solid var(--border)' }}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: Event['status'] }) {
  const config =
    status === 'SCHEDULED'
      ? { bg: 'rgba(34,197,94,0.2)', color: '#4ade80' }
      : status === 'CHANGED'
        ? { bg: 'rgba(245,158,11,0.2)', color: '#fbbf24' }
        : { bg: 'rgba(239,68,68,0.2)', color: '#f87171' }

  return (
    <span
      style={{
        background: config.bg,
        color: config.color,
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {status}
    </span>
  )
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
