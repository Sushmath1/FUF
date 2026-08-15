# PROMPT: Mobile Responsiveness Fix

## Context
Verify and fix mobile experience. The custom cursor should not appear on mobile/touch 
devices since there's no mouse. Also verify all pages work properly on small screens.

## CHANGE 1: Hide custom cursor on touch devices

Update src/components/CustomCursor.tsx to detect touch devices and not render at all:

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
  const [isTouchDevice, setIsTouchDevice] = useState(true) // default true so it doesn't flash on mobile
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number | undefined>(undefined)

  const emoji = THEME_CURSORS[festTheme] ?? THEME_CURSORS.DEFAULT

  useEffect(() => {
    // Detect if device has a real mouse (not touch-only)
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    setIsTouchDevice(!hasFinePointer)
  }, [])

  useEffect(() => {
    if (isTouchDevice) return // don't set up mouse tracking on touch devices

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
  }, [isTouchDevice])

  if (isTouchDevice) return null // render nothing on mobile/touch devices

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

## CHANGE 2: Fix cursor:none only applying on devices with a real cursor

In src/app/globals.css, update the cursor:none rule to only apply when there's a fine pointer (mouse), so mobile taps work normally without any cursor-hiding side effects:

```css
@media (pointer: fine) {
  * { cursor: none !important; }
}

@media (pointer: coarse) {
  * { cursor: auto !important; }
}
```

Remove any other unconditional `cursor: none` rules from the file — this media-query version should be the only place cursor is controlled.

## CHANGE 3: Verify and fix mobile layout issues

Check these specific things and fix any that are broken:

1. In src/app/college/register/page.tsx — the 5-step wizard:
   - Make sure form fields stack in a single column on screens under 640px width
   - Make sure the progress bar at top doesn't overflow
   - Make sure buttons at the bottom of each step are full-width on mobile

2. In src/app/visitor/schedule/page.tsx:
   - Make sure event cards are full width with proper padding on mobile
   - Make sure the floating chat button doesn't overlap with event cards
   - Make sure the chat panel takes full screen width on mobile instead of a fixed 380px

3. In src/app/visitor/map/page.tsx:
   - Make sure the Leaflet map container has responsive height (not fixed 380px on very small screens, use something like min(380px, 60vh))
   - Make sure building tabs scroll horizontally without breaking layout
   - Make sure the floor plan image scales properly within the viewport width

4. In src/components/Navbar.tsx:
   - On mobile, if there isn't room for all nav links, either hide less important ones or make it a hamburger menu
   - Make sure the logo and buttons don't overlap on small screens

Fix any of the above that are not already handled correctly. Test by resizing to 375px width.

## After changes

1. Run npm run dev
2. Resize browser to 375px width (or use Chrome DevTools device toolbar set to iPhone SE)
3. Check landing page, register wizard, schedule page, map page all look correct
4. Confirm cursor emoji does not appear when simulating a touch device in DevTools
5. Run npm run build — zero errors
6. Report done and list anything that still needs manual review
