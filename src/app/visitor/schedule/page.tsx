'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { ThemeProvider } from '@/components/ThemeProvider'
import { floorLabel } from '@/lib/floorLabel'
import { COLLEGE_ID_KEY, getOrCreateGuestId } from '@/lib/guestSession'
import { useOfflineCache } from '@/hooks/useOfflineCache'
import { usePusherUpdates } from '@/hooks/usePusherUpdates'

type ScheduleEvent = {
  id: string
  name: string
  description: string | null
  category: string
  venueName: string
  buildingName: string | null
  venueDirections: string | null
  floor: number | null
  startTime: string
  endTime: string
  status: string
  contactName: string | null
  contactNumber: string | null
  walkMinutesToNext: number | null
  tightWalk: boolean
  venueJustChanged: boolean
  previousVenueName: string | null
  conflictWithEventId: string | null
}

type ScheduleResponse = {
  collegeId: string
  collegeName: string
  festName: string
  theme: {
    primaryColor?: string | null
    secondaryColor?: string | null
    accentColor?: string | null
    bgColor?: string | null
    surfaceColor?: string | null
    fontStyle?: string | null
    moodText?: string | null
    particleStyle?: string | null
  }
  events: ScheduleEvent[]
  lastSyncedAt: string
}

type Recommendation = {
  eventId: string
  eventName: string
  category: string
  venueName: string
  startTime: string
  endTime: string
  reason: string
}

type ChatItem = { role: 'user' | 'ai'; text: string }

function fallbackDirections(event: ScheduleEvent) {
  if (event.buildingName && event.floor !== null) {
    return `Head to ${event.buildingName}, ${floorLabel(event.floor).toLowerCase()}, follow the path to ${event.venueName}`
  }
  if (event.buildingName) {
    return `Head to ${event.buildingName}, follow the path to ${event.venueName}`
  }
  return `Follow the highlighted path to reach ${event.venueName}`
}

export default function VisitorSchedulePage() {
  const { data: session, status: sessionStatus } = useSession()

  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([])
  const [interestInput, setInterestInput] = useState('')
  const [draftEvents, setDraftEvents] = useState<Array<{ id: string; name: string; venueName: string; startTime: string; endTime: string }>>([])
  const [draftLoading, setDraftLoading] = useState(false)
  const [flashIds, setFlashIds] = useState<string[]>([])
  const [conflictAdvice, setConflictAdvice] = useState<Record<string, string>>({})
  // Fallback for "Navigate to campus" if the schedule hasn't loaded (or has zero
  // events, so collegeId isn't in the response yet) but a college was saved from
  // an earlier verify or a previous visit to this page.
  const [storedCollegeId, setStoredCollegeId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(COLLEGE_ID_KEY)
    if (stored) setStoredCollegeId(stored)
  }, [])

  const sessionId = session?.user?.id ?? getOrCreateGuestId()
  const isGuest = !session?.user?.id
  const cacheKey = `fuf_schedule_${sessionId}`
  const { cached, save, lastSavedAt } = useOfflineCache<ScheduleResponse>(cacheKey)

  // useSession()'s own background check can stall indefinitely in some browsers
  // (a blocked request, a slow network) without ever resolving out of 'loading'.
  // Waiting on it with no escape hatch would leave every guest — the overwhelming
  // majority of visitors, who never log in at all — stuck on a page that never
  // fetches anything. Give it a couple of seconds, then proceed as a guest anyway;
  // worst case for a real visitor whose session is just slow is one wrong-id fetch
  // that a subsequent poll or focus refetch corrects once the session does resolve.
  const [gaveUpWaitingOnSession, setGaveUpWaitingOnSession] = useState(false)

  useEffect(() => {
    if (sessionStatus !== 'loading') return
    const timer = setTimeout(() => setGaveUpWaitingOnSession(true), 2000)
    return () => clearTimeout(timer)
  }, [sessionStatus])

  const fetchSchedule = useCallback(async () => {
    if (sessionStatus === 'loading' && !gaveUpWaitingOnSession) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/visitors/${sessionId}/schedule?type=${isGuest ? 'guest' : 'visitor'}`)
      const data = (await response.json()) as ScheduleResponse | { error: string }
      if (!response.ok) throw new Error((data as { error?: string }).error ?? 'Failed to load schedule')

      setSchedule(data as ScheduleResponse)
      save(data as ScheduleResponse)
      if ((data as ScheduleResponse).collegeId) {
        localStorage.setItem(COLLEGE_ID_KEY, (data as ScheduleResponse).collegeId)
      }
    } catch (loadError) {
      if (cached) {
        setSchedule(cached)
      } else {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load schedule')
      }
    } finally {
      setLoading(false)
    }
  }, [cached, isGuest, save, sessionId, sessionStatus, gaveUpWaitingOnSession])

  const fetchRecommendations = useCallback(async (collegeId: string) => {
    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId,
          ...(isGuest ? { guestSessionId: sessionId } : { visitorId: sessionId }),
        }),
      })

      const data = (await response.json()) as { recommendations?: Recommendation[] }
      setRecommendations(data.recommendations ?? [])
    } catch {
      setRecommendations([])
    }
  }, [isGuest, sessionId])

  useEffect(() => {
    void fetchSchedule()
  }, [fetchSchedule])

  useEffect(() => {
    if (schedule?.collegeId) {
      void fetchRecommendations(schedule.collegeId)
    }
  }, [schedule?.collegeId, fetchRecommendations])

  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)

    setOffline(!navigator.onLine)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchSchedule()
    }, 30000)

    return () => clearInterval(timer)
  }, [fetchSchedule])

  // Browsers throttle timers in background tabs, so a tab left open from before a
  // visitor verified (still showing the empty pre-registration state) can sit stale
  // well past the 30s poll interval — refetch the moment it's looked at again.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchSchedule()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [fetchSchedule])

  const onVenueChanged = useCallback(
    (payload: { eventId: string; newVenueName: string; previousVenueName: string }) => {
      setSchedule((prev) => {
        if (!prev) return prev

        const updatedEvents = prev.events.map((event) => {
          if (event.id !== payload.eventId) return event
          return {
            ...event,
            venueName: payload.newVenueName,
            previousVenueName: payload.previousVenueName,
            status: 'CHANGED',
            venueJustChanged: true,
          }
        })

        return { ...prev, events: updatedEvents, lastSyncedAt: new Date().toISOString() }
      })

      setFlashIds((prev) => [...prev, payload.eventId])
      setTimeout(() => {
        setFlashIds((prev) => prev.filter((id) => id !== payload.eventId))
      }, 1400)
    },
    [],
  )

  const onEventCancelled = useCallback((payload: { eventId: string }) => {
    setSchedule((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        events: prev.events.map((event) =>
          event.id === payload.eventId ? { ...event, status: 'CANCELLED' } : event,
        ),
      }
    })
    toast('An event was cancelled')
  }, [])

  const { isConnected } = usePusherUpdates({
    eventIds: schedule?.events.map((event) => event.id) ?? [],
    onVenueChanged,
    onEventCancelled,
  })

  const eventNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const event of schedule?.events ?? []) map.set(event.id, event.name)
    return map
  }, [schedule?.events])

  const askConflictAdvice = async (event: ScheduleEvent) => {
    if (!event.conflictWithEventId || conflictAdvice[event.id]) return

    const conflictName = eventNameById.get(event.conflictWithEventId) ?? 'another event'

    try {
      const response = await fetch('/api/ai/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEventName: event.name,
          conflictingEventName: conflictName,
          currentStart: event.startTime,
          currentEnd: event.endTime,
        }),
      })

      const data = (await response.json()) as { suggestion?: string }
      setConflictAdvice((prev) => ({
        ...prev,
        [event.id]: data.suggestion ?? 'Pick the event that matches your priority and join early.',
      }))
    } catch {
      setConflictAdvice((prev) => ({
        ...prev,
        [event.id]: 'Pick the event that matches your priority and join early.',
      }))
    }
  }

  useEffect(() => {
    for (const event of schedule?.events ?? []) {
      if (event.conflictWithEventId) {
        void askConflictAdvice(event)
      }
    }
  }, [schedule?.events])

  const sendChat = async () => {
    if (!schedule || !chatInput.trim()) return

    const message = chatInput.trim()
    setChatInput('')
    setChatHistory((prev) => [...prev, { role: 'user', text: message }])
    setChatLoading(true)

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          collegeId: schedule.collegeId,
          ...(isGuest ? { guestSessionId: sessionId } : { visitorId: sessionId }),
        }),
      })

      const data = (await response.json()) as { answer?: string }
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          text: data.answer ?? 'I could not answer that. Please check your schedule directly.',
        },
      ])
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'I could not answer that right now. Please try again in a moment.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const buildDraft = async () => {
    if (!schedule || !interestInput.trim()) return

    setDraftLoading(true)
    try {
      const response = await fetch('/api/ai/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: interestInput, collegeId: schedule.collegeId }),
      })

      const data = (await response.json()) as {
        suggestedEvents?: Array<{ id: string; name: string; venueName: string; startTime: string; endTime: string }>
      }
      setDraftEvents(data.suggestedEvents ?? [])
    } catch {
      setDraftEvents([])
    } finally {
      setDraftLoading(false)
    }
  }

  const addEvents = async (eventIds: string[]) => {
    if (!schedule || eventIds.length === 0) return

    try {
      const response = await fetch('/api/visitors/register-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId: schedule.collegeId,
          eventIds,
          ...(isGuest ? { guestSessionId: sessionId } : { visitorId: sessionId }),
        }),
      })

      const data = (await response.json()) as { added?: number; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not add events')

      toast.success(`Added ${data.added ?? 0} events to your schedule`)
      setDraftEvents([])
      void fetchSchedule()
      void fetchRecommendations(schedule.collegeId)
    } catch (addError) {
      toast.error(addError instanceof Error ? addError.message : 'Could not add events')
    }
  }

  if (loading && !schedule) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  if (error && !schedule) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </main>
    )
  }

  const theme = schedule?.theme ?? {}

  return (
    <ThemeProvider {...theme}>
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative', paddingBottom: 100 }}>
        <ParticleBackground />
        <Navbar role={session?.user?.role} />

        {offline && (
          <div
            style={{
              position: 'sticky',
              top: 60,
              zIndex: 80,
              background: '#f59e0b',
              color: '#111827',
              padding: '8px 16px',
              textAlign: 'center',
              fontWeight: 700,
            }}
          >
            Offline - showing your last saved schedule from {lastSavedAt ? new Date(lastSavedAt).toLocaleString('en-IN') : 'cache'}
          </div>
        )}

        <section style={{ width: 'min(980px, 100%)', margin: '0 auto', padding: '90px 20px 20px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(34px, 7vw, 52px)', fontWeight: 900, color: 'var(--primary)' }}>
                {schedule?.festName ?? 'My Schedule'}
              </h1>
              <p style={{ marginTop: 4 }}>{schedule?.collegeName ?? ''}</p>
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>{theme.moodText}</p>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '8px 14px',
            }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isConnected ? '#22c55e' : '#94a3b8',
                  animation: isConnected ? 'pulseGlow 1.3s ease-in-out infinite' : undefined,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 13 }}>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>

          {schedule && schedule.events.length === 0 && (
            <section className="card" style={{ marginTop: 20, padding: 18 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Let AI plan your fest day</h2>
              <textarea
                value={interestInput}
                onChange={(event) => setInterestInput(event.target.value)}
                placeholder="What are you into? Example: robotics, gaming, not business talks"
                rows={4}
              />
              <button
                className="btn-primary"
                onClick={buildDraft}
                disabled={draftLoading || !interestInput.trim()}
                style={{ marginTop: 12 }}
              >
                {draftLoading ? (
                  <>
                    <span className="spinner" /> AI is planning your day...
                  </>
                ) : (
                  'Build my schedule'
                )}
              </button>

              {draftEvents.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  {draftEvents.map((event) => (
                    <article key={event.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                      <p style={{ fontWeight: 700 }}>{event.name}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(event.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(event.endTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' | '}
                        {event.venueName}
                      </p>
                    </article>
                  ))}
                  <button className="btn-outline" onClick={() => addEvents(draftEvents.map((event) => event.id))}>
                    Accept this plan
                  </button>
                </div>
              )}
            </section>
          )}

          <section style={{ marginTop: 20 }}>
            {schedule?.events.map((event, index) => (
              <div key={event.id} style={{ marginBottom: 14 }}>
                <article
                  className={`card ${flashIds.includes(event.id) ? 'flash' : ''}`}
                  style={{
                    padding: 16,
                    borderColor:
                      event.status === 'CANCELLED'
                        ? '#ef4444'
                        : event.conflictWithEventId
                          ? '#f59e0b'
                          : event.status === 'CHANGED'
                            ? '#38bdf8'
                            : 'var(--border)',
                    boxShadow:
                      event.status === 'CHANGED'
                        ? '0 0 0 2px rgba(56,189,248,0.25)'
                        : undefined,
                  }}
                >
                  {event.status === 'CHANGED' && (
                    <p style={{ marginBottom: 8, fontSize: 13, color: '#7dd3fc' }}>
                      Venue updated - was {event.previousVenueName ?? 'previous venue'}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <h3
                        style={{
                          fontSize: 19,
                          fontWeight: 800,
                          textDecoration: event.status === 'CANCELLED' ? 'line-through' : 'none',
                        }}
                      >
                        {event.name}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                        {new Date(event.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(event.endTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                        Venue: {event.venueName}
                        {event.buildingName ? ` (${event.buildingName})` : ''}
                      </p>
                      <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
                        Contact: {event.contactName ?? 'Help desk'} {event.contactNumber ? `| ${event.contactNumber}` : ''}
                      </p>
                      <div style={{ marginTop: 10, padding: 12, background: 'var(--surface)', borderRadius: 10, fontSize: 13, color: 'var(--text)' }}>
                        📍 {event.venueDirections || fallbackDirections(event)}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        borderRadius: 999,
                        padding: '5px 10px',
                        background:
                          event.status === 'CANCELLED'
                            ? 'rgba(239,68,68,0.2)'
                            : event.status === 'CHANGED'
                              ? 'rgba(251,191,36,0.2)'
                              : 'rgba(34,197,94,0.2)',
                        color:
                          event.status === 'CANCELLED'
                            ? '#f87171'
                            : event.status === 'CHANGED'
                              ? '#fbbf24'
                              : '#4ade80',
                      }}
                    >
                      {event.status}
                    </span>
                  </div>

                  {event.conflictWithEventId && (
                    <div className="card" style={{ marginTop: 10, padding: 10, borderColor: '#f59e0b' }}>
                      <p style={{ color: '#fbbf24', fontWeight: 700 }}>
                        Overlaps with {eventNameById.get(event.conflictWithEventId) ?? 'another event'}
                      </p>
                      <p style={{ color: 'var(--text-muted)', marginTop: 5, fontSize: 14 }}>
                        {conflictAdvice[event.id] ?? 'Analyzing best option...'}
                      </p>
                    </div>
                  )}
                </article>

                {index < (schedule?.events.length ?? 0) - 1 && (
                  <p style={{ marginTop: 6, color: event.tightWalk ? '#fbbf24' : 'var(--text-muted)', fontSize: 13 }}>
                    Walk {event.walkMinutesToNext ?? '-'} mins to next event
                    {event.tightWalk ? ' | Tight transfer' : ''}
                  </p>
                )}
              </div>
            ))}
          </section>

          {schedule && schedule.events.length > 0 && recommendations.length > 0 && (
            <section style={{ marginTop: 22 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>You might also like</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {recommendations.slice(0, 3).map((recommendation, index) => (
                  <motion.article
                    key={recommendation.eventId}
                    className="card"
                    style={{ padding: 14 }}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <p style={{ fontWeight: 800 }}>{recommendation.eventName}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                      {new Date(recommendation.startTime).toLocaleString('en-IN')} | {recommendation.venueName}
                    </p>
                    <p style={{ marginTop: 6, color: 'var(--primary)' }}>{recommendation.reason}</p>
                    <button
                      className="btn-outline"
                      style={{ marginTop: 10 }}
                      onClick={() => addEvents([recommendation.eventId])}
                    >
                      Add to my schedule
                    </button>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/visitor/map?collegeId=${schedule?.collegeId ?? storedCollegeId}`} className="btn-primary" style={{ textDecoration: 'none' }}>
              Navigate to campus
            </Link>
            <p style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Last synced: {schedule?.lastSyncedAt ? new Date(schedule.lastSyncedAt).toLocaleString('en-IN') : '-'}
            </p>
          </div>
        </section>

        <button
          aria-label="Open chat"
          onClick={() => setChatOpen(true)}
          className="pulse-glow"
          style={{
            position: 'fixed',
            right: 18,
            bottom: 18,
            width: 58,
            height: 58,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--primary)',
            color: '#000',
            fontWeight: 900,
            zIndex: 120,
            cursor: 'pointer',
          }}
        >
          Chat
        </button>

        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.55)', zIndex: 130 }}
              />
              <motion.div
                initial={{ y: 420 }}
                animate={{ y: 0 }}
                exit={{ y: 420 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                style={{
                  position: 'fixed',
                  right: 16,
                  bottom: 16,
                  width: 'min(380px, calc(100vw - 24px))',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  zIndex: 140,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <p style={{ fontWeight: 800 }}>Ask about your schedule</p>
                  <button className="btn-outline" style={{ padding: '6px 10px' }} onClick={() => setChatOpen(false)}>
                    X
                  </button>
                </div>

                <div style={{ maxHeight: 340, overflowY: 'auto', padding: 12, display: 'grid', gap: 8 }}>
                  {chatHistory.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      Ask timing, venue, or conflict questions.
                    </p>
                  )}

                  {chatHistory.map((item, index) => (
                    <div
                      key={`${item.role}-${index}`}
                      style={{
                        justifySelf: item.role === 'user' ? 'end' : 'start',
                        maxWidth: '85%',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: item.role === 'user' ? 'var(--primary)' : 'var(--surface2)',
                        color: item.role === 'user' ? '#000' : 'var(--text)',
                      }}
                    >
                      {item.text}
                    </div>
                  ))}

                  {chatLoading && (
                    <div style={{ justifySelf: 'start', color: 'var(--text-muted)' }}>AI is typing...</div>
                  )}
                </div>

                <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask a question"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void sendChat()
                    }}
                  />
                  <button className="btn-primary" onClick={() => void sendChat()} disabled={chatLoading || !chatInput.trim()}>
                    Send
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </ThemeProvider>
  )
}
