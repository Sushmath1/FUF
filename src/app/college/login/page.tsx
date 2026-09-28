'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { credentialsSignIn } from '@/lib/credentialsSignIn'

export default function CollegeLogin() {
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

    const result = await credentialsSignIn('college', email, password, `${window.location.origin}/college/dashboard`)

    if (!result.ok) {
      setLoading(false)
      setError('Incorrect email or password')
      return
    }

    // A client-side router.push() here can outrace next-auth's own session-cache
    // update: the dashboard reads useSession() on that very first render, still
    // sees the pre-login "unauthenticated" state, and immediately bounces back
    // to this page even though the login itself succeeded. A hard navigation
    // forces a fresh load that picks up the just-set session cookie from the start.
    window.location.href = '/college/dashboard'
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <ParticleBackground />
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: 40, width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>College sign in</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>
          Access your fest admin dashboard
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleSubmit()}
          />

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={() => void handleSubmit()} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? (
              <>
                <span className="spinner" /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          New college?{' '}
          <Link href="/college/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
