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
  primary: '#be185d',
  secondary: '#831843',
  accent: '#f472b6',
  background: '#150810',
  surface: '#200a15',
  text: '#fce7f3',
  textMuted: 'rgba(252, 231, 243, 0.5)',
  border: 'rgba(244, 114, 182, 0.15)',
  gradient: 'linear-gradient(135deg, #150810 0%, #200a15 50%, #150810 100%)',
  glowColor: 'rgba(190, 24, 93, 0.3)',
  fontFamily: '"Inter", sans-serif',
  moodText: 'Your fest. Your schedule.',
  particleStyle: 'dots',
}

// Standard WCAG relative luminance — picks readable text over whatever
// background a college (or the AI theme generator) ends up choosing,
// since bgColor isn't guaranteed to be light or dark.
function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 1

  const channels = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
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
  const isLightBg = relativeLuminance(background) > 0.5

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
    text: isLightBg ? '#3d2817' : '#f1f5f9',
    textMuted: isLightBg ? 'rgba(61, 40, 23, 0.55)' : '#64748b',
    border: surface,
    gradient: `linear-gradient(135deg, ${background} 0%, ${surface} 50%, ${background} 100%)`,
    glowColor: `${primary}4d`,
    fontFamily: fontMap[college.fontStyle ?? 'default'] ?? fontMap.default,
    moodText: college.moodText ?? DEFAULT_THEME.moodText,
    particleStyle: college.particleStyle ?? 'dots',
  }
}