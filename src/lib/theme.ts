export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  gradient: string
  glowColor: string
  fontFamily: string
  moodText: string
  particleStyle: string
}

export const DEFAULT_THEME: ThemeColors = {
  primary: '#06b6d4',
  secondary: '#6366f1',
  accent: '#22c55e',
  background: '#030712',
  surface: '#0f172a',
  text: '#f1f5f9',
  textMuted: '#64748b',
  border: '#1e293b',
  gradient: 'linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)',
  glowColor: 'rgba(6,182,212,0.3)',
  fontFamily: '"Inter", sans-serif',
  moodText: 'Your fest. Your schedule.',
  particleStyle: 'dots',
}

export function buildThemeFromCollege(college: {
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  bgColor?: string | null
  surfaceColor?: string | null
  fontStyle?: string | null
  moodText?: string | null
  particleStyle?: string | null
}): ThemeColors {
  const primary = college.primaryColor ?? DEFAULT_THEME.primary
  const secondary = college.secondaryColor ?? DEFAULT_THEME.secondary
  const accent = college.accentColor ?? DEFAULT_THEME.accent
  const background = college.bgColor ?? DEFAULT_THEME.background
  const surface = college.surfaceColor ?? DEFAULT_THEME.surface

  const fontMap: Record<string, string> = {
    monospace: '"JetBrains Mono", monospace',
    serif: '"Playfair Display", serif',
    modern: '"Inter", "DM Sans", sans-serif',
    futuristic: '"Orbitron", "Rajdhani", sans-serif',
    traditional: '"Noto Sans", sans-serif',
    default: '"Inter", sans-serif',
  }

  return {
    primary,
    secondary,
    accent,
    background,
    surface,
    text: '#f1f5f9',
    textMuted: '#64748b',
    border: surface,
    gradient: `linear-gradient(135deg, ${background} 0%, ${surface} 50%, ${background} 100%)`,
    glowColor: `${primary}4d`,
    fontFamily: fontMap[college.fontStyle ?? 'default'] ?? fontMap.default,
    moodText: college.moodText ?? DEFAULT_THEME.moodText,
    particleStyle: college.particleStyle ?? 'dots',
  }
}