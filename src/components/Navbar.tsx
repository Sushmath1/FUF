'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface NavbarProps { role?: string }

export function Navbar({ role }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="navbar-glass"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontSize: 20, fontWeight: 900,
          background: 'linear-gradient(135deg, #c084fc, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
        }}>
          FindUrFest
        </span>
      </Link>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
        {role === 'college' && <>
          <Link href="/college/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Sign out</Link>
        </>}
        {role === 'visitor' && <>
          <Link href="/visitor/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Schedule</Link>
          <Link href="/visitor/history" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>History</Link>
          <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Sign out</Link>
        </>}
        {!role && <>
          <Link href="/college/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>College</Link>
          <Link href="/visitor/search" style={{
            color: 'white', textDecoration: 'none', fontWeight: 700,
            background: 'linear-gradient(135deg, #c084fc, #818cf8)',
            padding: '8px 16px', borderRadius: 10, fontSize: 13,
          }}>Find my fest →</Link>
        </>}
      </div>
    </motion.nav>
  )
}
