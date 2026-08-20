'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

import { PRESET_THEMES, type PresetTheme } from '@/lib/presetThemes'

interface ThemePickerProps {
  initialThemeId?: string
  onSelect: (theme: PresetTheme) => void
}

export function ThemePicker({ initialThemeId, onSelect }: ThemePickerProps) {
  const [selectedId, setSelectedId] = useState(initialThemeId ?? '')

  const handleSelect = (theme: PresetTheme) => {
    setSelectedId(theme.id)
    onSelect(theme)
  }

  return (
    <div>
      <p style={{
        fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
        color: 'var(--text-muted)', fontWeight: 700, marginBottom: 20, textAlign: 'center',
      }}>
        Choose your fest theme
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: 20,
      }}>
        {PRESET_THEMES.map(theme => (
          <motion.button
            key={theme.id}
            onClick={() => handleSelect(theme)}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}
          >
            <motion.div
              animate={{
                boxShadow: selectedId === theme.id
                  ? `0 0 0 3px var(--surface), 0 0 0 5px ${theme.primaryColor}, 0 8px 24px ${theme.primaryColor}55`
                  : `0 4px 16px ${theme.primaryColor}30`,
              }}
              transition={{ duration: 0.25 }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: theme.swatchGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Slow rotating soft glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: -6, borderRadius: '50%',
                  background: `conic-gradient(from 0deg, ${theme.primaryColor}00, ${theme.primaryColor}40, ${theme.primaryColor}00)`,
                  zIndex: -1,
                }}
              />
              {selectedId === theme.id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
            <span style={{
              fontSize: 13, fontWeight: selectedId === theme.id ? 700 : 500,
              color: selectedId === theme.id ? theme.primaryColor : 'var(--text-muted)',
            }}>
              {theme.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
