'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--gradient)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ParticleBackground style="dots" />
      <Navbar />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 520,
          paddingTop: 60,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              display: 'inline-block',
              background: 'var(--glow)',
              border: '1px solid var(--primary)',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              letterSpacing: 3,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            College Fest Navigator
          </motion.div>

          <h1
            style={{
              fontSize: 'clamp(56px, 10vw, 72px)',
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 16,
              letterSpacing: '-3px',
            }}
          >
            <span style={{ color: 'var(--text)' }}>Find</span>
            <span style={{ color: 'var(--primary)' }}>Ur</span>
            <span style={{ color: 'var(--text)' }}>Fest</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 48, lineHeight: 1.6 }}>
            Real-time venue updates. Personal schedules.
            <br />
            AI-powered. Never miss your event again.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/visitor/search"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'var(--primary)',
                  color: '#000',
                  padding: '16px 32px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 0 24px var(--glow)',
                }}
              >
                I am attending a fest
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/college/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'transparent',
                  color: 'var(--primary)',
                  padding: '16px 32px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 800,
                  textDecoration: 'none',
                  border: '1.5px solid var(--primary)',
                }}
              >
                Register my college
              </Link>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: 40, color: 'var(--text-muted)', fontSize: 13 }}
          >
            Already registered?{' '}
            <Link
              href="/college/login"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
            >
              College sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </main>
  )
}
