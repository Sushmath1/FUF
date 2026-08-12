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
