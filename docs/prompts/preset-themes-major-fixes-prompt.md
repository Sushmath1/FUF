# PROMPT: Replace AI Theme Gen with Presets + New Color Scheme + Dashboard Fixes
# Large combined prompt — work through in numbered order, stop and confirm after each section if running low on context

## SECTION 1: Replace AI theme generation with 6-8 preset themes

Remove the AI theme generation feature entirely (the "Generate theme with AI" 
button and description textarea) from BOTH the college register wizard Step 2 
AND the dashboard theme editor. Replace both with the same preset picker component.

### Create src/lib/presetThemes.ts

```typescript
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
```

### Create src/components/ThemePicker.tsx

```typescript
'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PRESET_THEMES, PresetTheme } from '@/lib/presetThemes'

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
```

### Update college register Step 2
Replace the entire AI theme generation section with:
```
<ThemePicker onSelect={(theme) => setThemeData(theme)} />
```
Store the selected preset's full color object in the wizard's state, include it 
in the final POST /api/colleges/register submission exactly as the AI-generated 
theme was before (same field names: primaryColor, secondaryColor, accentColor, 
bgColor, surfaceColor, fontStyle, moodText, particleStyle).

### Update dashboard theme editor
Same replacement — remove the manual color pickers AND any remaining AI generation 
UI, replace with `<ThemePicker initialThemeId={currentThemeId} onSelect={handleThemeChange} />`. 
On select, call PATCH /api/colleges/[id]/theme with the chosen preset's colors, 
show a toast confirmation "Theme updated!" on success.

### Delete the AI theme route usage
The POST /api/ai/generate-theme endpoint can stay in the codebase (harmless if unused) 
but remove all frontend calls to it — nothing should call this endpoint anymore.

## SECTION 2: New default app color scheme — maroon/wine dark mode

Update src/app/globals.css :root variables to this new default palette 
(this is the FindUrFest app's OWN branding, separate from fest presets):

```css
:root {
  --bg: #150810;
  --surface: rgba(190, 24, 93, 0.06);
  --surface2: rgba(190, 24, 93, 0.1);
  --border: rgba(244, 114, 182, 0.15);
  --text: #fce7f3;
  --text-muted: rgba(252, 231, 243, 0.5);
  --primary: #be185d;
  --secondary: #831843;
  --accent: #f472b6;
  --glow: rgba(190, 24, 93, 0.25);
  --gradient: linear-gradient(135deg, #150810 0%, #200a15 50%, #1a0a12 100%);
  --font: "Inter", sans-serif;
  --glass-bg: rgba(244, 114, 182, 0.05);
  --glass-border: rgba(244, 114, 182, 0.12);
  --glass-blur: blur(16px);
}
```

Update every place in the codebase that hardcodes the old orange colors 
(#ff6b47, #ff9a6c, #ffd4a8 etc.) to use var(--primary), var(--secondary), 
var(--accent) instead of hardcoded hex — search src/app and src/components 
for any hardcoded orange hex values and replace with the CSS variables so 
the whole app follows this new maroon/wine scheme consistently.

IMPORTANT — text contrast rule: no matter what background color is active 
(app's own maroon theme OR any fest preset a college picks), always verify 
text color has sufficient contrast against its background. Add this rule 
of thumb throughout: light text (var(--text)) on dark backgrounds, and 
ensure --text is always a light, high-contrast color relative to --bg 
in every theme definition (both the 8 presets in Section 1 and this 
maroon default).

## SECTION 3: Dashboard layout fixes

1. Remove the theme editing section's prominence — either move it into a 
   separate small settings/gear icon that opens a modal (like the Settings 
   screenshot reference: dark modal, "CUSTOMIZE THEME" label, theme circles, 
   close button), rather than a large section competing with the main dashboard 
   content. Build this as a modal triggered by a small settings icon in the 
   dashboard header.

2. Make "Add event" the clear primary action:
   - Increase its visual weight — larger button, positioned prominently at 
     the top of the events section
   - Everything else on the dashboard should visually defer to this button

3. Mobile centering: the "Upload attendee list" section and any other card-based 
   sections should be centered with appropriate padding on mobile widths 
   (under 640px), not left-aligned or overflowing.

## SECTION 4: Fix "Floor plan URL" confusing text input

Find wherever a "Floor plan URL" text input field currently exists (likely 
in the Add Building form on the map-setup page). Replace it with an actual 
file upload button:

```
<label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
  Floor plan image
</label>
<input 
  type="file" 
  accept="image/jpeg,image/png,image/jpg"
  onChange={handleFloorPlanUpload}
  style={{ /* style as a proper upload button, not a raw file input if possible */ }}
/>
```

The handleFloorPlanUpload function should read the file, convert to a base64 
data URL (consistent with how the campus map upload elsewhere in the app works), 
and store that as the floorPlanUrl value — the admin never sees or types a URL, 
they just pick a file from their device.

## Testing after all sections

1. Run npm run dev
2. Go to /college/register → Step 2 → should show 8 circular preset theme options 
   with the rotating glow effect, no AI textarea or generate button anywhere
3. Go to dashboard → confirm theme editing is now behind a settings icon/modal, 
   not a large section
4. Confirm "Add event" button is the most visually prominent element
5. Go to Map Setup → Add building → confirm there's a proper file upload button 
   for floor plan, not a text field asking for a URL
6. Check text is readable everywhere regardless of which preset theme is active
7. Resize to mobile width — confirm centered layout
8. Run npm run build — zero errors
9. Report done, list what was completed in each section
