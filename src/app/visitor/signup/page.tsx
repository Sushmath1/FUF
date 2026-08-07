'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

export default function VisitorSignup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email || !password) {
      setError('Email and password required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/visitors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Registration failed')
      router.push('/visitor/login')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative' }}>
      <ParticleBackground />
      <Navbar />

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: 'min(420px, 100%)', padding: 32, zIndex: 1 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Visitor sign up</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 20 }}>
          Save your schedule and revisit it later
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (optional)" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submit()
            }}
          />

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={() => void submit()} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </div>

        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          Already have an account? <Link href="/visitor/login" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </p>
        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Link href="/visitor/search" style={{ color: 'var(--primary)' }}>Continue without account</Link>
        </p>
      </motion.div>
    </main>
  )
}
