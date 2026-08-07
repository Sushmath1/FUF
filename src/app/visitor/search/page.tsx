'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

type SearchCollege = {
  id: string
  name: string
  festName: string
  festTagline?: string | null
  festStartDate: string
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  moodText?: string | null
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchCollege[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    fetch(`/api/colleges/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((response) => response.json())
      .then((data) => setResults((data.colleges ?? []) as SearchCollege[]))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingTop: 80, position: 'relative' }}>
      <ParticleBackground />
      <Navbar />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Find your fest</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            Search for your college to see live event updates
          </p>

          <div style={{ position: 'relative', marginBottom: 32 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search college name..."
              autoFocus
            />
            {loading && (
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <span className="spinner" style={{ color: 'var(--primary)' }} />
              </div>
            )}
          </div>

          <AnimatePresence>
            {results.map((college, index) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card"
                style={{ marginBottom: 12, padding: 20 }}
                whileHover={{ scale: 1.01 }}
              >
                <Link href={`/visitor/college/${college.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                        {college.festName}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{college.name}</p>
                      {college.festTagline && (
                        <p
                          style={{
                            color: 'var(--primary)',
                            fontSize: 12,
                            marginTop: 6,
                            fontStyle: 'italic',
                          }}
                        >
                          {college.festTagline}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        background: 'var(--glow)',
                        color: 'var(--primary)',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(college.festStartDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {college.primaryColor && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                      {[college.primaryColor, college.secondaryColor, college.accentColor]
                        .filter(Boolean)
                        .map((color, index2) => (
                          <div
                            key={`${college.id}-${index2}`}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: color ?? '#000',
                              border: '2px solid var(--border)',
                            }}
                          />
                        ))}
                      {college.moodText && (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginLeft: 8,
                            alignSelf: 'center',
                          }}
                        >
                          {college.moodText}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {query.length >= 2 && !loading && results.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}
            >
              No colleges found for "{query}"
            </motion.p>
          )}
        </motion.div>
      </div>
    </main>
  )
}
