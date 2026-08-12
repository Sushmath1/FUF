'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ParticleBackground } from '@/components/ParticleBackground'
import { Navbar } from '@/components/Navbar'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--gradient)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />
      <Navbar />

      {/* Soft background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(192,132,252,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '15%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560, paddingTop: 60 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(192,132,252,0.1)',
              border: '1px solid rgba(192,132,252,0.2)',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              letterSpacing: 2,
              color: 'var(--primary)',
              textTransform: 'uppercase' as const,
              fontWeight: 700,
              marginBottom: 28,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span>✦</span>
            College Fest Navigator
            <span>✦</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 'clamp(52px, 10vw, 80px)',
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 20,
              letterSpacing: '-3px',
            }}
          >
            <span style={{
              background: 'linear-gradient(135deg, #f0eeff, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Find
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #c084fc, #f472b6, #fb7185)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Ur
            </span>
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #60a5fa, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Fest
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 17,
              color: 'var(--text-muted)',
              marginBottom: 48,
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            Real-time venue updates. AI-powered personal schedules.
            <br />
            <span style={{ color: 'rgba(192,132,252,0.7)' }}>Never miss your event again.</span>
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380, margin: '0 auto' }}
          >
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/visitor/search" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'linear-gradient(135deg, #c084fc, #818cf8)',
                color: 'white',
                padding: '16px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(192,132,252,0.35)',
                letterSpacing: '0.2px',
              }}>
                🎉 I&apos;m attending a fest
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/college/register" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--primary)',
                padding: '16px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                border: '1px solid rgba(192,132,252,0.25)',
                backdropFilter: 'blur(16px)',
                letterSpacing: '0.2px',
              }}>
                🏫 Register my college
              </Link>
            </motion.div>
          </motion.div>

          {/* Bottom link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginTop: 36, color: 'var(--text-muted)', fontSize: 13 }}
          >
            Already registered?{' '}
            <Link href="/college/login" style={{
              color: 'var(--primary)', textDecoration: 'none',
              fontWeight: 600,
            }}>
              College sign in →
            </Link>
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              display: 'flex', flexWrap: 'wrap' as const,
              gap: 8, justifyContent: 'center', marginTop: 48,
            }}
          >
            {['⚡ Real-time updates', '🗺️ Campus navigation', '🤖 AI scheduling', '📱 Works offline'].map(f => (
              <span key={f} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                color: 'var(--text-muted)',
                backdropFilter: 'blur(8px)',
              }}>
                {f}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}
