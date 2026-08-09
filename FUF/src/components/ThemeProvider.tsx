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
