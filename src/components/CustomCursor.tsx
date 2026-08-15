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
