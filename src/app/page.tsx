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

      {/* Warm background blobs */}
      <div className="blob" style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="blob" style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: 450, height: 450,
        background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        animationDelay: '-3s',
      }} />
      <div style={{
        position: 'absolute', top: '35%', right: '10%',
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.04) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
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
              background: 'rgba(var(--primary-rgb),0.1)',
              border: '1px solid rgba(var(--primary-rgb),0.2)',
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: 12,
              letterSpacing: 2,
              color: 'var(--secondary)',
              textTransform: 'uppercase' as const,
              fontWeight: 700,
              marginBottom: 28,
              backdropFilter: 'blur(8px)',
            }}
          >
            College Fest Navigator
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
              backgroundImage: 'linear-gradient(135deg, var(--secondary), var(--primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Find</span>
            <span style={{
              backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Ur</span>
            <span style={{
              backgroundImage: 'linear-gradient(135deg, var(--accent), var(--primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Fest</span>
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
            }}
          >
            Real-time venue updates. AI-powered personal schedules.
            <br />
            <span style={{ color: 'rgba(var(--accent-rgb),0.7)' }}>Never miss your event again.</span>
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
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white',
                padding: '17px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(var(--primary-rgb),0.35)',
              }}>
                I&apos;m attending a fest
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/college/register" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'rgba(var(--accent-rgb),0.05)',
                color: 'var(--secondary)',
                padding: '17px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                border: '1px solid rgba(var(--primary-rgb),0.25)',
                backdropFilter: 'blur(16px)',
              }}>
                Register my college
              </Link>
            </motion.div>
          </motion.div>

          {/* Sign in link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginTop: 36, color: 'var(--text-muted)', fontSize: 13 }}
          >
            Already registered?{' '}
            <Link href="/college/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}>
              College sign in →
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </main>
  )
}
