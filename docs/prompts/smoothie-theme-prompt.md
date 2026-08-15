# PROMPT: Smoothie Theme UI Redesign
# Dark warm base with peach + coral + cream accents
# Target: 19 year olds, fun, trendy, NOT the typical AI purple/blue look

## Context
Replace the current purple/blue theme entirely with a warm smoothie-inspired palette.
Dark espresso/brown-black background with warm peach, coral, and cream glowing on top.
Think: dark cozy cafe + warm sunset colors. Very different from typical AI products.
Keep glassmorphism cards and calm particles but in warm colors.
Remove AI theme generation option — keep only default theme + skip option.

---

## CHANGE 1: src/app/globals.css — Replace theme colors entirely

Replace ONLY the :root variables and color-related parts. Keep all the card/button/animation classes but update colors:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #120e0a;
  --surface: rgba(255, 200, 160, 0.04);
  --surface2: rgba(255, 200, 160, 0.07);
  --border: rgba(255, 200, 160, 0.1);
  --text: #fdf0e8;
  --text-muted: rgba(253, 240, 232, 0.45);
  --primary: #ff6b47;
  --secondary: #ff9a6c;
  --accent: #ffd4a8;
  --glow: rgba(255, 107, 71, 0.2);
  --gradient: linear-gradient(135deg, #120e0a 0%, #1e1208 40%, #1a0f0a 100%);
  --font: "Inter", sans-serif;
  --glass-bg: rgba(255, 200, 160, 0.04);
  --glass-border: rgba(255, 200, 160, 0.08);
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

*, *:hover { cursor: none !important; }

#custom-cursor {
  position: fixed;
  width: 24px;
  height: 24px;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  filter: drop-shadow(0 0 8px var(--primary));
  transition: font-size 0.15s ease;
  user-select: none;
  line-height: 1;
}

#custom-cursor.hovering {
  font-size: 24px;
  filter: drop-shadow(0 0 16px var(--primary));
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.2s;
}

.card:hover {
  border-color: rgba(255, 200, 160, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--glass-border);
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #ff6b47, #ff9a6c);
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
  box-shadow: 0 4px 20px rgba(255, 107, 71, 0.35);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 107, 71, 0.5);
}
.btn-primary:active { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.45; transform: none; }

.btn-outline {
  background: var(--glass-bg);
  color: var(--primary);
  border: 1px solid rgba(255, 107, 71, 0.35);
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
  background: rgba(255, 107, 71, 0.1);
  box-shadow: 0 0 20px rgba(255, 107, 71, 0.2);
  transform: translateY(-2px);
}
.btn-outline:active { transform: scale(0.97); }

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
  border-color: rgba(255, 107, 71, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 107, 71, 0.1);
}
input::placeholder, textarea::placeholder { color: var(--text-muted); }

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
  40% { background: rgba(255, 107, 71, 0.12); }
  100% { background: var(--glass-bg); }
}
.flash { animation: flash 1s ease; }

@keyframes blobMove {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); }
  33% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.05); }
  66% { border-radius: 50% 60% 30% 60% / 40% 30% 70% 60%; transform: scale(0.97); }
}
.blob { animation: blobMove 8s ease-in-out infinite; }

.navbar-glass {
  background: rgba(18, 14, 10, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
}

.glow-text {
  text-shadow: 0 0 20px var(--primary), 0 0 40px rgba(255, 107, 71, 0.3);
}

.gradient-text {
  background: linear-gradient(135deg, #ffd4a8, #ff9a6c, #ff6b47);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-3d:hover {
  transform: perspective(1000px) rotateX(-2deg) rotateY(2deg) translateY(-4px);
  box-shadow: 20px 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--glass-border);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.badge-primary { background: rgba(255,107,71,0.15); color: var(--primary); border: 1px solid rgba(255,107,71,0.2); }
.badge-success { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
.badge-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.badge-warning { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
.pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px var(--glow); }
  50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow); }
}
```

---

## CHANGE 2: src/components/ParticleBackground.tsx — Warm peach particles

Replace the file:

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

    // Warm colored barely visible particles
    const warmColors = [
      'rgba(255, 107, 71,',   // coral
      'rgba(255, 154, 108,',  // peach
      'rgba(255, 212, 168,',  // cream
      'rgba(255, 180, 120,',  // warm orange
    ]

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas?.width ?? 800),
      y: Math.random() * (canvas?.height ?? 600),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.12 + 0.03,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.008 + 0.004,
      color: warmColors[Math.floor(Math.random() * warmColors.length)],
    }))

    let animId: number

    const draw = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.twinkle += p.twinkleSpeed
        const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${opacity})`
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
      }}
    />
  )
}
```

---

## CHANGE 3: src/components/CustomCursor.tsx — Warm themed cursor

Replace the cursor emojis with warm themed ones:

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

// Warm themed cursor emojis
const THEME_CURSORS: Record<string, string> = {
  TECH: '⚡',
  CULTURAL: '🌸',
  ONAM: '🌺',
  NEON: '✨',
  SPACE: '🚀',
  MINIMAL: '○',
  CUSTOM: '✦',
  DEFAULT: '🍑',  // peach for default smoothie vibe
}

interface CustomCursorProps {
  festTheme?: string
}

export function CustomCursor({ festTheme = 'DEFAULT' }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number | undefined>(undefined)

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
      setIsHovering(!!target.closest('button, a, input, textarea, select, [role="button"]'))
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
      style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99999, transform: 'translate(-50%, -50%)' }}
    >
      {emoji}
    </div>
  )
}
```

---

## CHANGE 4: src/app/page.tsx — Warm smoothie landing page

Replace the entire file:

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

      {/* Warm background blobs */}
      <div className="blob" style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,107,71,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="blob" style={{
        position: 'absolute', bottom: '-15%', right: '-10%',
        width: 450, height: 450,
        background: 'radial-gradient(circle, rgba(255,154,108,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        animationDelay: '-3s',
      }} />
      <div style={{
        position: 'absolute', top: '35%', right: '10%',
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(255,212,168,0.04) 0%, transparent 70%)',
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
              background: 'rgba(255,107,71,0.1)',
              border: '1px solid rgba(255,107,71,0.2)',
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
            🍑 College Fest Navigator
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
              background: 'linear-gradient(135deg, #fdf0e8, #ffd4a8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Find</span>
            <span style={{
              background: 'linear-gradient(135deg, #ff9a6c, #ff6b47)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Ur</span>
            <span style={{
              background: 'linear-gradient(135deg, #ffd4a8, #ffb380)',
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
            <span style={{ color: 'rgba(255,154,108,0.7)' }}>Never miss your event again.</span>
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
                background: 'linear-gradient(135deg, #ff6b47, #ff9a6c)',
                color: 'white',
                padding: '17px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(255,107,71,0.35)',
              }}>
                🎉 I&apos;m attending a fest
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link href="/college/register" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'rgba(255,200,160,0.05)',
                color: 'var(--secondary)',
                padding: '17px 32px', borderRadius: 16,
                fontSize: 16, fontWeight: 800, textDecoration: 'none',
                border: '1px solid rgba(255,107,71,0.25)',
                backdropFilter: 'blur(16px)',
              }}>
                🏫 Register my college
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

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center', marginTop: 48 }}
          >
            {['⚡ Real-time updates', '🗺️ Campus navigation', '🤖 AI scheduling', '📱 Works offline'].map(f => (
              <span key={f} style={{
                background: 'rgba(255,200,160,0.05)',
                border: '1px solid rgba(255,200,160,0.1)',
                borderRadius: 20, padding: '6px 14px',
                fontSize: 12, color: 'var(--text-muted)',
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

## CHANGE 5: src/components/Navbar.tsx — Warm colored navbar

Update gradient text color in the logo only:

In the FindUrFest logo span, change the gradient from purple to warm:
```
background: 'linear-gradient(135deg, #ff9a6c, #ff6b47)'
```

And in the "Find my fest" button change:
```
background: 'linear-gradient(135deg, #ff6b47, #ff9a6c)'
```

---

## CHANGE 6: src/app/college/register/page.tsx — Remove AI theme option, keep default only

In Step 2 of the register wizard:
- Remove the AI theme generation textarea and button entirely
- Remove the font style dropdown
- Remove the particle style dropdown  
- Remove all manual color pickers
- Replace the entire Step 2 content with just this:

```
<div style={{ textAlign: 'center', padding: '40px 20px' }}>
  <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Theme</h3>
  <p style={{ color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
    Your fest will use the default FindUrFest theme — warm, modern, and great for any event. 
    You can customise this later from your dashboard.
  </p>
  <div style={{ 
    display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 
  }}>
    {['#ff6b47', '#ff9a6c', '#ffd4a8', '#120e0a'].map(color => (
      <div key={color} style={{
        width: 40, height: 40, borderRadius: '50%',
        background: color,
        border: '2px solid rgba(255,200,160,0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }} />
    ))}
  </div>
  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
    Coral · Peach · Cream · Dark — your fest palette
  </p>
</div>
```

---

## After all changes

1. Run: npm run dev
2. Check localhost:3000 — should show warm dark background, coral/peach gradient title, warm particles
3. Move mouse — should see 🍑 cursor following
4. Go to /college/register — Step 2 should show the simple theme preview with no AI button
5. Run: npm run build — must pass with zero errors
6. Report done
