export interface PresetTheme {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor: string
  surfaceColor: string
  moodText: string
  fontStyle: 'modern' | 'serif' | 'monospace' | 'futuristic' | 'traditional'
  particleStyle: 'dots' | 'stars' | 'sparks' | 'petals' | 'bubbles'
  swatchGradient: string // for the picker UI circle preview
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'nova',
    name: 'Nova',
    primaryColor: '#c026d3',
    secondaryColor: '#7c3aed',
    accentColor: '#a855f7',
    bgColor: '#0f0a1a',
    surfaceColor: '#1a1128',
    moodText: 'Electric and bold',
    fontStyle: 'futuristic',
    particleStyle: 'sparks',
    swatchGradient: 'linear-gradient(135deg, #c026d3, #7c3aed)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    primaryColor: '#10b981',
    secondaryColor: '#06b6d4',
    accentColor: '#34d399',
    bgColor: '#081310',
    surfaceColor: '#0f2019',
    moodText: 'Calm and fresh',
    fontStyle: 'modern',
    particleStyle: 'dots',
    swatchGradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primaryColor: '#f97316',
    secondaryColor: '#ef4444',
    accentColor: '#fbbf24',
    bgColor: '#180d08',
    surfaceColor: '#241209',
    moodText: 'Warm and lively',
    fontStyle: 'modern',
    particleStyle: 'sparks',
    swatchGradient: 'linear-gradient(135deg, #f97316, #ef4444)',
  },
  {
    id: 'glacier',
    name: 'Glacier',
    primaryColor: '#3b82f6',
    secondaryColor: '#0ea5e9',
    accentColor: '#60a5fa',
    bgColor: '#08111a',
    surfaceColor: '#0f1e2e',
    moodText: 'Cool and sharp',
    fontStyle: 'modern',
    particleStyle: 'bubbles',
    swatchGradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
  },
  {
    id: 'wine',
    name: 'Wine',
    primaryColor: '#be185d',
    secondaryColor: '#831843',
    accentColor: '#f472b6',
    bgColor: '#1a0a12',
    surfaceColor: '#26101a',
    moodText: 'Deep and elegant',
    fontStyle: 'serif',
    particleStyle: 'petals',
    swatchGradient: 'linear-gradient(135deg, #be185d, #831843)',
  },
  {
    id: 'meadow',
    name: 'Meadow',
    primaryColor: '#65a30d',
    secondaryColor: '#ca8a04',
    accentColor: '#a3e635',
    bgColor: '#0d1006',
    surfaceColor: '#161c0d',
    moodText: 'Earthy and organic',
    fontStyle: 'traditional',
    particleStyle: 'petals',
    swatchGradient: 'linear-gradient(135deg, #65a30d, #ca8a04)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    primaryColor: '#6366f1',
    secondaryColor: '#1e293b',
    accentColor: '#818cf8',
    bgColor: '#050508',
    surfaceColor: '#0d0d14',
    moodText: 'Sleek and minimal',
    fontStyle: 'modern',
    particleStyle: 'stars',
    swatchGradient: 'linear-gradient(135deg, #6366f1, #1e293b)',
  },
  {
    id: 'candy',
    name: 'Candy',
    primaryColor: '#ec4899',
    secondaryColor: '#a855f7',
    accentColor: '#fb7185',
    bgColor: '#160810',
    surfaceColor: '#20101a',
    moodText: 'Fun and youthful',
    fontStyle: 'modern',
    particleStyle: 'sparks',
    swatchGradient: 'linear-gradient(135deg, #ec4899, #a855f7)',
  },
]
