'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { credentialsSignIn } from '@/lib/credentialsSignIn'

export default function VisitorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    const result = await credentialsSignIn('visitor', email, password, `${window.location.origin}/visitor/schedule`)

    if (!result.ok) {
      setLoading(false)
      setError('Incorrect email or password')
      return
    }

    // Hard navigation, not router.push: avoids racing next-auth's session-cache
    // update on the destination page (see college/login for the full explanation).
    window.location.href = '/visitor/schedule'
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
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Visitor sign in</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 20 }}>
          Access your saved event schedule
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit()
            }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>

        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          New here? <Link href="/visitor/signup" style={{ color: 'var(--primary)' }}>Create account</Link>
        </p>
        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
          <Link href="/visitor/search" style={{ color: 'var(--primary)' }}>Continue without account</Link>
        </p>
      </motion.div>
    </main>
  )
}
