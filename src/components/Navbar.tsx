'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface NavbarProps { role?: string }

type NavLink = { href: string; label: string; primary?: boolean }

export function Navbar({ role }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const links: NavLink[] =
    role === 'college'
      ? [
          { href: '/college/dashboard', label: 'Dashboard' },
          { href: '/api/auth/signout', label: 'Sign out' },
        ]
      : role === 'visitor'
        ? [
            { href: '/visitor/schedule', label: 'Schedule' },
            { href: '/visitor/history', label: 'History' },
            { href: '/api/auth/signout', label: 'Sign out' },
          ]
        : [
            { href: '/college/login', label: 'College' },
            { href: '/visitor/search', label: 'Find my fest →', primary: true },
          ]

  const linkStyle = (primary?: boolean) =>
    primary
      ? {
          color: 'white',
          textDecoration: 'none' as const,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #ff6b47, #ff9a6c)',
          padding: '8px 16px',
          borderRadius: 10,
          fontSize: 13,
        }
      : { color: 'var(--text-muted)', textDecoration: 'none' as const, fontWeight: 500 }

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
          backgroundImage: 'linear-gradient(135deg, #ff9a6c, #ff6b47)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.5px',
        }}>
          FindUrFest
        </span>
      </Link>

      <div className="navbar-links-desktop" style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={linkStyle(link.primary)}>
            {link.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="navbar-hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          fontSize: 22,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div
          className="navbar-mobile-menu"
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            backdropFilter: 'var(--glass-blur)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 14,
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: link.primary ? 'var(--primary)' : 'var(--text)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .navbar-links-desktop {
            display: none !important;
          }
          .navbar-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </motion.nav>
  )
}
