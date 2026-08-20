'use client'
import { useEffect, useRef } from 'react'

const FALLBACK_COLORS = ['rgba(190, 24, 93,', 'rgba(244, 114, 182,', 'rgba(131, 24, 67,', 'rgba(219, 39, 119,']

function hexToRgbaPrefix(hex: string): string | null {
  const clean = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b},`
}

function readThemeColors(): string[] {
  const styles = getComputedStyle(document.documentElement)
  const colors = [styles.getPropertyValue('--primary'), styles.getPropertyValue('--secondary'), styles.getPropertyValue('--accent')]
    .map(hexToRgbaPrefix)
    .filter((value): value is string => value !== null)

  return colors.length > 0 ? colors : FALLBACK_COLORS
}

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

    // Re-read whenever ThemeProvider updates the CSS variables on
    // documentElement (e.g. a new preset theme is selected), so particles
    // pick up the change instead of staying stuck on the color read at mount.
    let colors = readThemeColors()
    const observer = new MutationObserver(() => {
      colors = readThemeColors()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * (canvas?.width ?? 800),
      y: Math.random() * (canvas?.height ?? 600),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.15 + 0.06,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.008 + 0.004,
      colorIndex: Math.floor(Math.random() * 4),
    }))

    let animId: number

    const draw = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.twinkle += p.twinkleSpeed
        const opacity = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle))
        const color = colors[p.colorIndex % colors.length]

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${opacity})`
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
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}
