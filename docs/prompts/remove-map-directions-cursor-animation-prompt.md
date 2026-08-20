# PROMPT: Remove Indoor GPS Map + Add Text Directions + Fix Cursor + Fix Missing Animations

## Context
4 separate fixes. Keep outdoor building-level GPS map (already working, don't touch). 
Remove the GPS mini-map ONLY from indoor venue/room placement — replace with 
click-on-floor-plan + auto-generated text directions instead.

---

## FIX 1: Remove GPS mini-map from indoor venue placement, keep it for buildings

1. On the "Add building" form (map-setup page): KEEP the GPS mini-map as-is — 
   this correctly captures the building's outdoor lat/lng for GPS routing between 
   buildings, which still needs to work exactly as before. Do not change this part.

2. On the "Add venue" form: this should NOT have any map at all (confirm it doesn't — 
   if there's any leftover GPS/mini-map component here, remove it). Venue placement 
   should only ever use click-on-floor-plan-image to capture xPercent/yPercent, 
   which should already be implemented from the previous prompt — verify this is 
   working correctly and there's no map component mixed in.

## FIX 2: Add auto-generated text directions alongside the floor plan route

Currently when a visitor selects a venue, the floor plan shows a dashed line from 
entrance to the room (already built). Add text-based step directions alongside this.

1. When an admin adds a venue via click-on-floor-plan, in addition to capturing 
   xPercent/yPercent, also let them optionally add simple direction text, e.g. 
   a small text input: "Directions (optional)" with placeholder like 
   "Take the stairs to floor 2, room is on the left"
   
2. Add a `directions` field (String, optional) to the Venue model in 
   prisma/schema.prisma, run npx prisma generate and npx prisma db push after

3. Update the venue creation API route to accept and save this directions field

4. On the visitor-facing floor plan view (wherever the FloorPlan component with 
   the dashed route line is shown), display the directions text below/alongside 
   the floor plan image:
   ```
   <div style={{ marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 10, fontSize: 13, color: 'var(--text)' }}>
     📍 {venue.directions || `Follow the highlighted path to reach ${venue.name}`}
   </div>
   ```
   If no custom directions were entered by the admin, show a sensible auto-generated 
   fallback like "Follow the highlighted path to reach [venue name]" using the 
   building name and floor number if available, e.g. "Head to [Building name], 
   floor [X], follow the path to [venue name]"

## FIX 3: Change cursor from heart to theme-appropriate star

In src/components/CustomCursor.tsx, replace all emoji values with star variants 
so it fits any theme better than a heart:

```typescript
const THEME_CURSORS: Record<string, string> = {
  TECH: '⚡',
  CULTURAL: '✦',
  ONAM: '✦',
  NEON: '✦',
  SPACE: '✦',
  MINIMAL: '✦',
  CUSTOM: '✦',
  DEFAULT: '✦',
}
```

Since the app now uses the 8 preset themes (Nova, Aurora, Sunset, Glacier, Wine, 
Meadow, Obsidian, Candy) instead of the old theme categories, update this mapping 
to work off the preset id instead. Check src/lib/presetThemes.ts for the preset 
list and update CustomCursor to accept a `presetId` prop, using ✦ (star) as the 
cursor for all presets — keep it simple with one consistent star cursor rather 
than per-theme emoji variation, since the color glow around the cursor already 
adapts via var(--primary).

Also make sure the cursor's drop-shadow glow color updates correctly based on 
whichever preset theme is currently active (it should already do this via 
`var(--primary)` in the CSS — just verify it's working, don't break it).

## FIX 4: Fix missing animations on theme change

When a college's preset theme changes (or when previewing a preset before saving), 
report says there's no movement/animation happening. Investigate and fix:

1. Check if ParticleBackground component re-renders/re-initializes when the 
   CSS variable --primary changes (from a new theme being applied) — since the 
   particle canvas reads the primary color once on mount via 
   `getComputedStyle(document.documentElement).getPropertyValue('--primary')`, 
   if the theme changes AFTER the component already mounted, particles will keep 
   using the OLD color and may appear static/stale. Fix this by re-reading the 
   CSS variable whenever the theme changes, not just once on mount — use a 
   MutationObserver on document.documentElement style attribute, or accept the 
   color as a prop that changes when theme changes, whichever is simpler given 
   the current component structure.

2. Check that ThemeProvider component actually triggers a visible re-render/update 
   when a new preset is selected — confirm the CSS custom properties are being 
   set on document.documentElement correctly and that dependent components 
   (particles, blobs, gradients) pick up the change.

3. Verify the blob/orb floating animations (the `.blob` class with `blobMove` 
   keyframe) are still present in globals.css after the maroon theme color 
   update — confirm they weren't accidentally removed, and that they use 
   var(--primary) so their glow color updates with theme changes too.

4. Test: on the college register Step 2, click between different preset themes 
   rapidly — particles, blobs, and any background animation should visibly 
   update to the new color within the animation without needing a page refresh.

## Testing after all fixes

1. Run npm run dev
2. Confirm Add Venue form has no map, only click-on-floor-plan
3. Confirm Add Building form still has the GPS mini-map working
4. Add a venue with directions text, verify it shows on the visitor floor plan view
5. Move mouse around the app — cursor should be a star (✦), glowing in the 
   current theme's primary color, no heart emoji anywhere
6. On register Step 2, click through a few different presets — confirm 
   particles/blobs visibly change color and keep moving
7. Run npm run build — zero errors
8. Report done
