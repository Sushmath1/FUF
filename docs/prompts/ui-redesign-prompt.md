# PROMPT: Complete UI Redesign
# Goal: Soft pastel dark theme, glassmorphism cards, calm particles, custom cursor

## Context
Redesign the entire app UI to feel trendy, clean, and impressive.
Style reference: soft pastel dark — like a dark version of soft girl aesthetic.
Cards should have frosted glass effect. Background should have barely visible slow drifting particles.
Cursor should be a small custom themed icon that follows the mouse.

Do these changes one file at a time. Stop and confirm after each major section.

---

## CHANGE 1: src/app/globals.css — Complete CSS overhaul

Replace the entire globals.css with this:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0d0d1a;
  --surface: rgba(255, 255, 255, 0.05);
  --surface2: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.1);
  --text: #f0eeff;
  --text-muted: rgba(240, 238, 255, 0.45);
  --primary: #c084fc;
  --secondary: #818cf8;
  --accent: #34d399;
  --glow: rgba(192, 132, 252, 0.25);
  --gradient: linear-gradient(135deg, #0d0d1a 0%, #130d2e 50%, #0d1a1a 100%);
  --font: "Inter", sans-serif;
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: blur(16px);
}

* { box-sizing: border-box; margin: 0; padding: 0; cursor: none; }

html {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  scroll-behavior: smooth;
}

body {
  background: var(--gradient);
  min-height: 100vh;
  transition: background 0.8s ease;
  overflow-x: hidden;
}

/* Hide default cursor everywhere */
*, *:hover { cursor: none !important; }

/* Custom cursor */
#custom-cursor {
  position: fixed;
  width: 24px;
  height: 24px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  filter: drop-shadow(0 0 8px var(--primary));
}

#custom-cursor.hovering {
  width: 32px;
  height: 32px;
  font-size: 24px;
  filter: drop-shadow(0 0 16px var(--primary));
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

/* Glass card — the main card style used everywhere */
.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--glass-border);
  transform: translateY(-2px);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  font-weight: 700;
  border-radius: 14px;
  padding: 14px 28px;
  border: none;
  font-size: 15px;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.2px;
  box-shadow: 0 4px 20px rgba(192, 132, 252, 0.3);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(192, 132, 252, 0.5);
}
.btn-primary:active { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.45; transform: none; }

.btn-outline {
  background: var(--glass-bg);
  color: var(--primary);
  border: 1px solid rgba(192, 132, 252, 0.4);
  font-weight: 700;
  border-radius: 14px;
  padding: 14px 28px;
  font-size: 15px;
  backdrop-filter: var(--glass-blur);
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-outline:hover {
  background: rgba(192, 132, 252, 0.1);
  box-shadow: 0 0 20px rgba(192, 132, 252, 0.25);
  transform: translateY(-2px);
}
.btn-outline:active { transform: scale(0.97); }

/* Inputs */
input, textarea, select {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text);
  font-size: 15px;
  padding: 13px 16px;
  width: 100%;
  outline: none;
  backdrop-filter: var(--glass-blur);
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: var(--font);
}
input:focus, textarea:focus, select:focus {
  border-color: rgba(192, 132, 252, 0.5);
  box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.1);
}
input::placeholder, textarea::placeholder { color: var(--text-muted); }

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-8px) rotate(1deg); }
  66% { transform: translateY(-4px) rotate(-1deg); }
}
.float { animation: float 6s ease-in-out infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-up { animation: slideUp 0.4s ease forwards; }

@keyframes flash {
  0% { background: var(--glass-bg); }
  40% { background: rgba(192, 132, 252, 0.15); }
  100% { background: var(--glass-bg); }
}
.flash { animation: flash 1s ease; }

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Glass navbar */
.navbar-glass {
  background: rgba(13, 13, 26, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
}

/* Soft glow text */
.glow-text {
  text-shadow: 0 0 20px var(--primary), 0 0 40px rgba(192, 132, 252, 0.3);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #c084fc, #818cf8, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 3D card effect */
.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-3d:hover {
  transform: perspective(1000px) rotateX(-2deg) rotateY(2deg) translateY(-4px);
  box-shadow: 20px 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--glass-border);
}

/* Soft pill badge */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.badge-primary { background: rgba(192,132,252,0.15); color: var(--primary); border: 1px solid rgba(192,132,252,0.2); }
.badge-success { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.badge-warning { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
```

---

## CHANGE 2: src/components/CustomCursor.tsx — Create this new component

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

const THEME_CURSORS: Record<string, string> = {
  TECH: '⚡',
  CULTURAL: '🌸',
  ONAM: '🌺',
  NEON: '✦',
  SPACE: '🚀',
  MINIMAL: '◎',
  CUSTOM: '✦',
  DEFAULT: '✦',
}

interface CustomCursorProps {
  festTheme?: string
}

export function CustomCursor({ festTheme = 'DEFAULT' }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number>()

  const emoji = THEME_CURSORS[festTheme] ?? THEME_CURSORS.DEFAULT

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${posRef.current.x}px`
        cursorRef.current.style.top = `${posRef.current.y}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = target.closest('button, a, input, textarea, select, [role="button"]')
      setIsHovering(!!isInteractive)
    }

    window.addEventListener('mousemove', moveCursor, { passive: true })
    window.addEventListener('mouseover', handleMouseOver)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      id="custom-cursor"
      className={isHovering ? 'hovering' : ''}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-50%, -50%)',
        fontSize: isHovering ? '22px' : '16px',
        filter: `drop-shadow(0 0 8px var(--primary))`,
        transition: 'font-size 0.15s ease, filter 0.15s ease',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      {emoji}
    </div>
  )
}
```

---

## CHANGE 3: src/components/ParticleBackground.tsx — Calm barely visible particles

Replace the entire file with:

```typescript
'use client'
import { useEffect, useRef } from 'react'

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener('resize', setSize)

    // Very few, very slow, barely visible particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.15 + 0.03,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.01 + 0.005,
    }))

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.twinkle += p.twinkleSpeed
        const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(192, 132, 252, ${opacity})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 1,
      }}
    />
  )
}
```

---

## CHANGE 4: src/app/layout.tsx — Add CustomCursor

Import and add the CustomCursor component to layout.tsx:

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { CustomCursor } from '@/components/CustomCursor'

export const metadata: Metadata = {
  title: 'FindUrFest — Your fest, your schedule',
  description: 'Real-time venue updates and personal schedules for college fests',
  themeColor: '#0d0d1a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(13, 13, 26, 0.9)',
              color: '#f0eeff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              fontSize: '14px',
              backdropFilter: 'blur(16px)',
            },
            duration: 5000,
          }}
        />
      </body>
    </html>
  )
}
```

---

## CHANGE 5: src/app/page.tsx — Redesigned landing page

Replace src/app/page.tsx with:

```typescript
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
```

---

## CHANGE 6: src/components/Navbar.tsx — Glass navbar

Update the navbar to use the glass style:

```typescript
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
```

---

## After all changes

1. Run: npm run dev
2. Check localhost:3000 — landing page should look soft, dark, pastel purple with barely visible particles
3. Move mouse — should see a small ✦ emoji cursor following it
4. Hover over buttons — cursor should get slightly larger
5. Run: npm run build — must pass with zero errors
6. Confirm done and list any issues found
