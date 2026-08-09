'use client'

import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

type HistoryItem = {
  collegeId: string
  collegeName: string | null
  festName: string | null
  festDate: string | null
  events: Array<{ name: string; venueName: string; startTime: string }>
}

export default function VisitorHistoryPage() {
  const { data: session } = useSession()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch(`/api/visitors/${session.user.id}/history`)
        const data = (await response.json()) as { history?: HistoryItem[]; error?: string }
        if (!response.ok) throw new Error(data.error ?? 'Could not load history')
        setHistory(data.history ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load history')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [session?.user?.id])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative' }}>
      <ParticleBackground />
      <Navbar role="visitor" />

      <section style={{ width: 'min(980px, 100%)', margin: '0 auto', padding: '90px 20px 30px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8 }}>Past fests</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your event attendance history</p>

        {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

        {history.length === 0 && (
          <div className="card" style={{ padding: 20 }}>
            <p style={{ color: 'var(--text-muted)' }}>No history yet. Attend events to see them here.</p>
          </div>
        )}

        {history.map((item, index) => (
          <motion.article
            key={item.collegeId}
            className="card"
            style={{ padding: 18, marginBottom: 14 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{item.festName ?? 'Fest'}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {item.collegeName} {item.festDate ? `| ${new Date(item.festDate).toLocaleDateString('en-IN')}` : ''}
            </p>

            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {item.events.map((event, eventIndex) => (
                <div key={`${item.collegeId}-${eventIndex}`} className="card" style={{ padding: 10 }}>
                  <p style={{ fontWeight: 700 }}>{event.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {event.venueName} | {new Date(event.startTime).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </motion.article>
        ))}
      </section>
    </main>
  )
}
