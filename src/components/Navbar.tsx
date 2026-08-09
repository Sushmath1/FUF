'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface NavbarProps {
  role?: string
}

export function Navbar({ role }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(3,7,18,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--primary)',
            letterSpacing: '-0.5px',
          }}
        >
          FindUrFest
        </span>
      </Link>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
        {role === 'college' && (
          <>
            <Link href="/college/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Sign out
            </Link>
          </>
        )}

        {role === 'visitor' && (
          <>
            <Link href="/visitor/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Schedule
            </Link>
            <Link href="/visitor/history" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              History
            </Link>
            <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Sign out
            </Link>
          </>
        )}

        {!role && (
          <>
            <Link href="/college/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              College
            </Link>
            <Link
              href="/visitor/search"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
            >
              Find my fest
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
