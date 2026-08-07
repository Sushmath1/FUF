'use client'

import { useEffect, useRef } from 'react'

interface ParticleBackgroundProps {
  style?: 'dots' | 'stars' | 'sparks' | 'petals' | 'bubbles'
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  twinkle: number
}

export function ParticleBackground({ style = 'dots' }: ParticleBackgroundProps) {
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

    const primary =
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4'

    const count = style === 'stars' ? 80 : style === 'sparks' ? 40 : 60
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (style === 'sparks' ? 1.5 : 0.4),
      vy: (Math.random() - 0.5) * (style === 'sparks' ? 1.5 : 0.4),
      size: style === 'stars' ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }))

    let animId = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.twinkle += 0.02
        const opacity = style === 'stars' ? p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle)) : p.opacity

        ctx.beginPath()
        if (style === 'bubbles') {
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.strokeStyle = `${primary}${Math.round(opacity * 150)
            .toString(16)
            .padStart(2, '0')}`
          ctx.lineWidth = 1
          ctx.stroke()
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = `${primary}${Math.round(opacity * 255)
            .toString(16)
            .padStart(2, '0')}`
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

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', setSize)
    }
  }, [style])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.5,
      }}
    />
  )
}
