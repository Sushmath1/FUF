# PROMPT 3: Frontend — All UI Pages + AI Features
# FindUrFest — Full production build with AI
# Dark theme, Framer Motion animations, dynamic college themes, AI chatbot, auto-schedule

## Prerequisites
Prompts 1 and 2 fully complete.

## Install additional packages
```bash
npm install framer-motion --legacy-peer-deps
```

---

## CRITICAL RULES — READ BEFORE BUILDING ANYTHING
1. Every page: 'use client' at top if it uses hooks
2. Every page: export a default function returning visible JSX — never return null
3. Every data fetch: loading state → error state → success state
4. Every button: disabled + spinner while action runs
5. Build in the exact order listed — verify each page shows before next
6. All animations: Framer Motion only
7. The visitor schedule page reads the college's theme from the API response and applies it as CSS custom properties on the html element

---

## FILE: src/app/globals.css
Replace the entire file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #030712;
  --surface: #0f172a;
  --surface2: #1e293b;
  --border: #1e293b;
  --text: #f1f5f9;
  --text-muted: #64748b;
  --primary: #06b6d4;
  --secondary: #6366f1;
  --accent: #22c55e;
  --glow: rgba(6,182,212,0.3);
  --gradient: linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%);
  --font: "Inter", sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); color: var(--text); font-family: var(--font); scroll-behavior: smooth; }
body { background: var(--gradient); min-height: 100vh; transition: background 0.5s ease; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.card:hover { border-color: var(--primary); box-shadow: 0 0 16px var(--glow); }

.glow { box-shadow: 0 0 20px var(--glow); }
.glow-text { text-shadow: 0 0 20px var(--primary); }

.btn-primary {
  background: var(--primary);
  color: #000;
  font-weight: 700;
  border-radius: 10px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:hover { box-shadow: 0 0 20px var(--glow); transform: translateY(-1px); }
.btn-primary:active { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-outline {
  background: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  font-weight: 700;
  border-radius: 10px;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-outline:hover { background: var(--glow); box-shadow: 0 0 16px var(--glow); transform: translateY(-1px); }
.btn-outline:active { transform: scale(0.97); }

input, textarea, select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 15px;
  padding: 12px 16px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: var(--font);
}
input:focus, textarea:focus, select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--glow);
}
input::placeholder, textarea::placeholder { color: var(--text-muted); }

@keyframes flash {
  0% { background: var(--surface); }
  30% { background: color-mix(in srgb, var(--primary) 20%, var(--surface)); }
  100% { background: var(--surface); }
}
.flash { animation: flash 1.2s ease; }

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 6px var(--glow); }
  50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow); }
}
.pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 18px; height: 18px;
  border: 2.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.float { animation: float 3s ease-in-out infinite; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-up { animation: slideUp 0.4s ease forwards; }
```

---

## FILE: src/app/layout.tsx

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FindUrFest — Your fest, your schedule',
  description: 'Real-time venue updates and personal schedules for college fests',
  themeColor: '#030712',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              fontSize: '14px',
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

## FILE: src/components/ThemeProvider.tsx

```typescript
'use client'
import { useEffect } from 'react'
import { buildThemeFromCollege } from '@/lib/theme'

interface Props {
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  surfaceColor?: string | null
  fontStyle?: string | null
  moodText?: string | null
  particleStyle?: string | null
  children: React.ReactNode
}

export function ThemeProvider({ children, ...themeProps }: Props) {
  useEffect(() => {
    const theme = buildThemeFromCollege(themeProps)
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--bg', theme.background)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--text-muted', theme.textMuted)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--glow', theme.glowColor)
    root.style.setProperty('--gradient', theme.gradient)
    root.style.setProperty('--font', theme.fontFamily)
    document.body.style.fontFamily = theme.fontFamily
  }, [JSON.stringify(themeProps)])

  return <>{children}</>
}
```

---

## FILE: src/components/ParticleBackground.tsx

```typescript
'use client'
import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
  style?: 'dots' | 'stars' | 'sparks' | 'petals' | 'bubbles'
}

export function ParticleBackground({ style = 'dots' }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    setSize()
    window.addEventListener('resize', setSize)

    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4'

    const count = style === 'stars' ? 80 : style === 'sparks' ? 40 : 60
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (style === 'sparks' ? 1.5 : 0.4),
      vy: (Math.random() - 0.5) * (style === 'sparks' ? 1.5 : 0.4),
      size: style === 'stars' ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }))

    let animId: number
    let frame = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      for (const p of particles) {
        p.twinkle += 0.02
        const opacity = style === 'stars' ? p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle)) : p.opacity

        ctx.beginPath()
        if (style === 'bubbles') {
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.strokeStyle = `${primary}${Math.round(opacity * 150).toString(16).padStart(2, '0')}`
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `${primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
          ctx.fill()
        }

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
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', setSize) }
  }, [style])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }}
    />
  )
}
```

---

## FILE: src/components/Navbar.tsx

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
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
          FindUrFest
        </span>
      </Link>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
        {role === 'college' && <>
          <Link href="/college/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign out</Link>
        </>}
        {role === 'visitor' && <>
          <Link href="/visitor/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Schedule</Link>
          <Link href="/visitor/history" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>History</Link>
          <Link href="/api/auth/signout" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign out</Link>
        </>}
        {!role && <>
          <Link href="/college/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>College</Link>
          <Link href="/visitor/search" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Find my fest →</Link>
        </>}
      </div>
    </motion.nav>
  )
}
```

---

## FILE: src/app/page.tsx — Landing Page
BUILD AND VERIFY THIS FIRST before any other page.

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
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <ParticleBackground style="dots" />
      <Navbar />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520, paddingTop: 60 }}>
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

          <h1 style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 16,
            letterSpacing: '-3px',
          }}>
            <span style={{ color: 'var(--text)' }}>Find</span>
            <span style={{ color: 'var(--primary)' }}>Ur</span>
            <span style={{ color: 'var(--text)' }}>Fest</span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 48, lineHeight: 1.6 }}>
            Real-time venue updates. Personal schedules.
            <br />AI-powered. Never miss your event again.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/visitor/search" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'var(--primary)', color: '#000',
                padding: '16px 32px', borderRadius: 12,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                boxShadow: '0 0 24px var(--glow)',
              }}>
                🎉 I&apos;m attending a fest
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/college/register" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'transparent', color: 'var(--primary)',
                padding: '16px 32px', borderRadius: 12,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                border: '1.5px solid var(--primary)',
              }}>
                🏫 Register my college
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
            <Link href="/college/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              College sign in →
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </main>
  )
}
```

Run `npm run dev` — confirm this shows before continuing.

---

## FILE: src/app/college/register/page.tsx
5-step wizard. Build each step as a separate section rendered based on a `step` state variable.

Step 1 — Basic details:
- College name, short name, fest name, tagline (optional), start date, end date, contact name, contact number, admin email, password, confirm password
- Validate inline: password 8+ chars, confirm password matches, email valid

Step 2 — Theme setup (THE IMPRESSIVE PART):
Build this section:
- A textarea: "Describe your fest theme" — placeholder: "e.g. Cyberpunk dark — neon green electric vibes / Ancient India — gold and red royal / Onam harvest — yellow and green floral"
- A "Generate theme with AI ✨" button — calls POST /api/ai/generate-theme
- Show a loading state while generating: animated dots "Generating your theme..."
- On success: show a live preview panel:
  - A small colored rectangle strip showing all 5 generated colors (primary, secondary, accent, bg, surface)
  - The mood text shown in the generated primary color
  - Apply the theme to this page in real time using ThemeProvider
- Manual override: show 5 color pickers below the AI result so admin can tweak any color
- Font style selector: show 5 font name examples in their actual fonts (monospace, serif, modern, futuristic, traditional)
- Particle style selector: 5 labeled cards with a tiny description (dots, stars, sparks, petals, bubbles)
- "Regenerate" button to try again with same or different description

Step 3 — Campus map:
- Drag and drop image upload (accept JPG, PNG)
- Show preview after upload
- Tip card: "Don't have a campus map? Open Google Maps → search your college → switch to Satellite view → take a screenshot"

Step 4 — Buildings:
- Show uploaded map image
- "Click anywhere on the map to add a building pin"
- On click: capture xPercent/yPercent from click position, show a form asking building name and short name
- List placed pins below
- "Add later from dashboard" skip button

Step 5 — Done:
- Summary card showing: college name, fest name, dates, theme preview
- "Create my account ✨" button — POST to /api/colleges/register
- On success: fire confetti (canvas-confetti) + "Go to dashboard" button link

Progress bar at top: colored bar filling up based on current step.

---

## FILE: src/app/college/login/page.tsx

```typescript
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'

export default function CollegeLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    const result = await signIn('college', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) { setError('Incorrect email or password') }
    else { router.push('/college/dashboard') }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ParticleBackground />
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: 40, width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>College sign in</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>Access your fest admin dashboard</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign in →'}
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
```

---

## FILE: src/app/college/dashboard/page.tsx

Auth check: if no session or role !== 'college', redirect to /college/login.

Fetch events from GET /api/colleges/[id]/events on mount.

Layout:
- Fixed top header: fest name (large), "LIVE" badge if fest is active, "Add event" button
- Left panel (60% width on desktop, full on mobile): event list
  - Group by date if multi-day
  - Each card: category emoji + name + venue + time + status badge
  - Status colors: green (SCHEDULED), amber (CHANGED), red (CANCELLED)
  - "Change venue" button → dropdown of venues
  - "Edit time" button → inline time pickers
  - "Cancel" button → confirmation modal: "This will instantly notify all registered visitors"
  - When admin saves a change, the card flashes the theme's primary color
  - Empty state: "No events yet — add your first event"
- Right panel (40% width on desktop, hidden on mobile with a tab toggle):
  - Theme editor: shows current theme colors, "Edit theme" button that opens the same theme setup UI from registration
  - "Upload attendee list" — CSV upload with drag/drop
  - Stats: events today, total registered visitors
  - Link to map setup

---

## FILE: src/app/college/map-setup/page.tsx

Two tabs: Buildings | Venues

Buildings tab:
- List of existing buildings as cards with edit/delete buttons
- "Add building" button
- Each building card: name, floors, GPS status dot (green if set, grey if not), floor plan status
- Edit building: update name, GPS, floors, upload/replace floor plan, set entrance point
- Expandable Leaflet mini-map (dynamic import, ssr:false) showing all pins

Venues tab:
- Grouped by building
- Each venue: name, floor, position status on floor plan
- "Add venue inside [building]" → shows floor plan image with click-to-place interaction
- Walk-time entry: simple two-dropdown + number input for admin to enter minutes between venue pairs

---

## FILE: src/app/visitor/search/page.tsx

```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ParticleBackground } from '@/components/ParticleBackground'
import { Navbar } from '@/components/Navbar'

function useDebounce<T>(value: T, delay: number) {
  const [deb, setDeb] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDeb(value), delay); return () => clearTimeout(t) }, [value, delay])
  return deb
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const dq = useDebounce(query, 300)

  useEffect(() => {
    if (dq.length < 2) { setResults([]); return }
    setLoading(true)
    fetch(`/api/colleges/search?q=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => setResults(d.colleges ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [dq])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingTop: 80, position: 'relative' }}>
      <ParticleBackground />
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Find your fest</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Search for your college to see live event updates</p>

          <div style={{ position: 'relative', marginBottom: 32 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search college name..."
              autoFocus
            />
            {loading && (
              <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <span className="spinner" style={{ color: 'var(--primary)' }} />
              </div>
            )}
          </div>

          <AnimatePresence>
            {results.map((college, i) => (
              <motion.div key={college.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
                style={{ marginBottom: 12, padding: 20 }}
                whileHover={{ scale: 1.01 }}
              >
                <Link href={`/visitor/college/${college.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{college.festName}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{college.name}</p>
                      {college.festTagline && <p style={{ color: 'var(--primary)', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>{college.festTagline}</p>}
                    </div>
                    <div style={{
                      background: 'var(--glow)', color: 'var(--primary)',
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      {new Date(college.festStartDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {college.primaryColor && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                      {[college.primaryColor, college.secondaryColor, college.accentColor].filter(Boolean).map((c, i) => (
                        <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c!, border: '2px solid var(--border)' }} />
                      ))}
                      {college.moodText && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8, alignSelf: 'center' }}>{college.moodText}</span>}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {query.length >= 2 && !loading && results.length === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
              No colleges found for &quot;{query}&quot;
            </motion.p>
          )}
        </motion.div>
      </div>
    </main>
  )
}
```

---

## FILE: src/app/visitor/college/[id]/page.tsx

Fetch college from /api/colleges/[id]. Apply ThemeProvider with the college's colors.

Show:
- Full-width banner: college's bannerUrl if set, otherwise a gradient using the college's primary/secondary colors with the fest name in large text and the mood text below it. This banner adapts to the college's theme — an Onam fest will show a gold/green banner, a cyberpunk fest will show a neon/dark one.
- Below banner: verification card
  - "Find my registered events" heading
  - Email input + Phone input (fill either or both)
  - "Find my events" button → POST /api/visitors/verify
  - Loading: "Checking registrations..."
  - Success: confetti + "Found X events: [event name list]" + "View my schedule →" button
  - Zero found: amber card with suggestions
- Public event list below (read only, grouped by category with emoji icons)

---

## FILE: src/app/visitor/schedule/page.tsx

This is the most important page. AI chatbot, real-time updates, theme, everything.

On mount:
1. Get guestSessionId or visitorId
2. Fetch schedule from /api/visitors/[id]/schedule
3. Apply ThemeProvider with the returned theme
4. Connect Pusher (import usePusherUpdates from prompt 4)
5. Set up offline cache (import useOfflineCache from prompt 4)
6. Fetch recommendations from /api/ai/recommend
7. Poll every 30 seconds as fallback

Top section:
- Fest name in large text using theme's primary color
- College name smaller below
- Theme's mood text in small italic
- Live indicator: green pulsing dot + "Live" if Pusher connected, grey dot + "Offline" if not

Offline banner (show only when offline):
- Amber banner at the very top: "📡 Offline — showing your last saved schedule from [time]"

Event cards (see design spec below):
- DEFAULT: card with event name, time badge, venue with pin icon, building name, contact
- CHANGED: blue glow border + bell icon banner inside card: "Venue updated — was [prev]". Flash animation plays when status changes.
- CANCELLED: red border + strikethrough name + red "Cancelled" badge. Keep visible.
- CONFLICT: orange border + "⚠ Overlaps with [event name]" badge. Show AI conflict suggestion below it (fetch from /api/ai/resolve-conflict lazily on first render).
- Walk-time connector between cards: small text with 🚶 icon
- TIGHT WALK: amber colored connector + ⚠ icon

AI chatbot (floating bottom right):
- Circular button with ✨ or 💬 icon, glowing with theme's primary color
- Clicking opens a slide-up panel (full width on mobile, 380px on desktop)
- Panel header: "Ask about your schedule"
- Message history displayed as chat bubbles
- Text input at bottom with send button
- On send: POST /api/ai/ask — show typing indicator (3 dots animation)
- AI answers appear as a different colored bubble
- Panel closes on click outside or X button

Auto-schedule section (show only before visitor has any events):
- Card: "Let AI plan your fest day ✨"
- Textarea: "What are you into? (e.g. robotics, gaming, not business talks)"
- "Build my schedule" button → POST /api/ai/auto-schedule
- Show loading: "AI is planning your day..."
- Show result as a draft event list with "Accept this plan" button
- Accepting calls /api/visitors/verify logic to register for those events

Recommendations section (show after schedule loads, below the main event list):
- Heading: "You might also like ✨"
- Up to 3 cards: event name, time, venue, the AI's reason
- "Add to my schedule" button on each → calls /api/visitors/verify
- Animate in with a staggered slide-up

Bottom:
- "🗺 Navigate to campus" button → /visitor/map?collegeId=...
- Last synced timestamp

---

## FILE: src/app/visitor/login/page.tsx and visitor/signup/page.tsx
Same pattern as college/login.tsx but using 'visitor' provider for signIn.
Both show "Continue without account →" link pointing to /visitor/search.

---

## FILE: src/app/visitor/history/page.tsx
Past fests grouped by college. Empty state if no history. Redirect handled by middleware.

---

## Build order — follow exactly
1. globals.css → layout.tsx → no crash
2. page.tsx (landing) → verify it shows
3. components (Navbar, ThemeProvider, ParticleBackground)
4. visitor/search
5. visitor/college/[id]
6. visitor/schedule (most complex — build last, use mock data initially)
7. college/login
8. college/register (wizard)
9. college/dashboard
10. college/map-setup
11. visitor/login, signup, history, map

After each: confirm not blank, check mobile 375px, check animations work.

`npm run build` — zero errors
`git add . && git commit -m "prompt 3 frontend done"`
