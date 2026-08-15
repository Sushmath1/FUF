# PROMPT: Restore AI Theme Generation + Lighter Colorful Theme + Fix Cursor

## Context
Three changes needed on top of the current smoothie theme:
1. Restore the AI theme generation feature in Step 2 of college register (it was removed in the last change)
2. Change background from dark to a lighter, colorful, warm palette — still smoothie vibes but not dark/moody
3. Change the cursor emoji away from 🍑 (has an unintended double meaning) to something more appropriate

Do these one at a time. Stop after each and confirm.

---

## CHANGE 1: src/app/globals.css — Lighter colorful background

Update ONLY the :root variables to use a lighter warm palette:

```css
:root {
  --bg: #fff6ef;
  --surface: rgba(255, 255, 255, 0.6);
  --surface2: rgba(255, 255, 255, 0.8);
  --border: rgba(255, 138, 91, 0.15);
  --text: #3d2817;
  --text-muted: rgba(61, 40, 23, 0.55);
  --primary: #ff6b47;
  --secondary: #ff9a6c;
  --accent: #ffb84d;
  --glow: rgba(255, 107, 71, 0.15);
  --gradient: linear-gradient(135deg, #fff6ef 0%, #ffe8d6 40%, #ffedf0 100%);
  --font: "Inter", sans-serif;
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-border: rgba(255, 138, 91, 0.15);
  --glass-blur: blur(16px);
}

html {
  background: var(--bg);
  color: var(--text);
}
```

Also update these color-dependent rules to work on light background:

```css
.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 20px rgba(255, 138, 91, 0.06);
}

.card:hover {
  border-color: rgba(255, 107, 71, 0.3);
  box-shadow: 0 8px 32px rgba(255, 138, 91, 0.15);
  transform: translateY(-2px);
}

.navbar-glass {
  background: rgba(255, 246, 239, 0.75);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
}

input, textarea, select {
  background: rgba(255, 255, 255, 0.7);
  color: var(--text);
  border: 1px solid var(--glass-border);
}
input::placeholder, textarea::placeholder { color: rgba(61, 40, 23, 0.4); }

::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: rgba(255, 138, 91, 0.3); }
```

Add a subtle colorful animated gradient shift on the body:

```css
@keyframes warmShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

body {
  background: linear-gradient(120deg, #fff6ef, #ffe8d6, #ffedf0, #fff0e5);
  background-size: 300% 300%;
  animation: warmShift 15s ease infinite;
  min-height: 100vh;
}
```

---

## CHANGE 2: src/components/ParticleBackground.tsx — Colorful particles for light bg

Update particle colors to be visible against the light background (darker/more saturated versions):

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

    const warmColors = [
      'rgba(255, 107, 71,',
      'rgba(255, 154, 108,',
      'rgba(255, 184, 77,',
      'rgba(255, 138, 91,',
    ]

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas?.width ?? 800),
      y: Math.random() * (canvas?.height ?? 600),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.15 + 0.06,
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
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}
```

---

## CHANGE 3: src/components/CustomCursor.tsx — Fix the cursor emoji

Replace the DEFAULT emoji and adjust others to be clearly fest/navigation themed, avoiding any awkward double meanings:

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

const THEME_CURSORS: Record<string, string> = {
  TECH: '⚡',
  CULTURAL: '🎭',
  ONAM: '🌼',
  NEON: '✨',
  SPACE: '🚀',
  MINIMAL: '○',
  CUSTOM: '✦',
  DEFAULT: '🧡',
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

Also update the cursor glow filter in globals.css since it's now on a light background — change the drop-shadow to work on light bg:

```css
#custom-cursor {
  filter: drop-shadow(0 0 6px rgba(255, 107, 71, 0.6));
}

#custom-cursor.hovering {
  filter: drop-shadow(0 0 12px rgba(255, 107, 71, 0.8));
}
```

---

## CHANGE 4: src/app/college/register/page.tsx — Restore AI theme generation in Step 2

Replace the simplified Step 2 (the color-swatch-only version) with the full AI generation flow:

```
Step 2 should contain, in this order:

1. Heading: "Design your fest theme"
2. Large textarea with placeholder: "Describe your fest vibe... e.g. Cyberpunk neon nights, Ancient royal gold, Beach summer party, Onam harvest festival"
3. Big button: "Generate theme with AI ✨" 
   - On click: calls POST /api/ai/generate-theme with { description, collegeId }
   - Shows loading state: "Creating your theme..." with animated dots
   - On success: shows the generated theme preview below

4. After generation, show:
   - Color swatches (5 circles: primary, secondary, accent, background, surface)
   - The generated mood text displayed in the primary color
   - Font style shown as example text in that font
   - "Regenerate" button to try again
   - "Looks good, continue" button

5. Below the AI section, add a smaller text link: "Skip and use the default FindUrFest theme instead"
   - Clicking this skips theme generation and applies the default warm coral/peach palette
   - This should be a text link, not a prominent button, since AI generation is the primary path

6. If AI generation fails: show a friendly error "Couldn't generate a theme right now. Try again or skip to use our default theme."

Make sure the theme description, generated colors, font style, and mood text are saved to state and included in the final registration submission (POST /api/colleges/register), same as the original implementation before it was simplified.
```

---

## After all changes

1. Run: npm run dev
2. Check localhost:3000 — should show a light warm cream/peach background, NOT dark, with visible colorful particles
3. Move mouse — should see 🧡 cursor (not the peach emoji)
4. Go to /college/register → Step 2 → should show the AI theme generator with textarea and generate button, plus a skip link
5. Run: npm run build — must pass with zero errors
6. Report done
