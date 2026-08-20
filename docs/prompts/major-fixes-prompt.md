# PROMPT: Fix Event Creation, Dashboard Theme UI, Building/Venue Forms, Contrast, and Performance
# Multiple issues bundled together — work through them in order, don't stop between unless something breaks

## ISSUE 1: "Invalid event data" when adding an event

The college dashboard "Add event" form fails with "Invalid event data". Root cause 
is likely that no venues exist yet (venue dropdown shows "Select venue" placeholder 
with nothing selectable) or the venueId isn't being validated/passed correctly.

1. Open the Add Event form component and the event creation API route
2. Add temporary logging in the API route to see the actual body being submitted 
   and which validation field fails:
   ```typescript
   console.log('EVENT SUBMIT BODY:', JSON.stringify(body, null, 2))
   if (!result.success) {
     console.error('EVENT VALIDATION FAILED:', JSON.stringify(result.error.flatten(), null, 2))
   }
   ```
3. Fix the root cause: venue dropdown should be disabled with a helpful message 
   ("Add a building and venue first from Map Setup") if no venues exist yet, 
   rather than allowing submission with an empty venueId
4. Test by first adding a building + venue (see Issue 3 below), then confirm 
   event creation works with a real venueId selected

## ISSUE 2: Dashboard theme editor — remove manual color pickers, AI-only

The college dashboard has a "Primary / Secondary / Accent / Background / Surface" 
manual color input section. Remove this entirely and replace with the same AI-only 
theme flow used during registration:

1. Find the dashboard theme editing section (likely in the college dashboard page 
   or a ThemeEditor component)
2. Remove all manual hex color text inputs
3. Replace with: a text description input + "Generate theme with AI" button, 
   same pattern as college register Step 2, calling the same 
   POST /api/ai/generate-theme endpoint
4. Show the current active theme preview (using the ThemePreviewCard component 
   already built) above the generate button, and the new one below after regenerating
5. Add a "Save this theme" confirm button before it actually updates the college record

## ISSUE 3: Add Building form — replace raw lat/lng and X%/Y% inputs with click-based UI

This is the most important fix. Currently the "Add building" and "Add venue" forms 
ask admins to manually type Latitude, Longitude, Entrance X%, Entrance Y% as plain 
number inputs. This is not usable by a non-technical person. Replace with:

### For Add Building (GPS location):
1. Keep the Name, Short name, and Floor plan URL upload fields as text/file inputs — those are fine
2. Remove the Latitude and Longitude text input fields entirely
3. Below the Name field, show the existing Leaflet mini-map (already present on this 
   page) as the way to set location: "Click on the map below to mark this building's location"
4. When the admin clicks anywhere on the mini-map, capture the lat/lng from that 
   click event automatically and store it in component state — do not require any 
   manual typing
5. Show a marker appear on the map at the clicked location so the admin gets visual 
   confirmation, with the building name label if entered
6. The "Add building" submit button uses the lat/lng captured from the map click, 
   not from any text field

### For Add Venue (position on floor plan):
1. Keep Name, Select building dropdown, and Floor number as-is
2. Remove the "X % on floor plan" and "Y % on floor plan" text input fields entirely
3. Instead, once a building is selected in the dropdown, show that building's 
   uploaded floor plan image directly in this form (fetch its floorPlanUrl)
4. Instructions above the image: "Click on the floor plan to mark where this room is"
5. When admin clicks on the image, calculate the click position as a percentage 
   of the image's width and height automatically:
   ```typescript
   const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
     const rect = e.currentTarget.getBoundingClientRect()
     const xPercent = ((e.clientX - rect.left) / rect.width) * 100
     const yPercent = ((e.clientY - rect.top) / rect.height) * 100
     setVenuePosition({ xPercent, yPercent })
   }
   ```
6. Show a small pin marker appear on the image at the clicked spot for visual confirmation
7. If no building is selected yet, or the selected building has no floor plan uploaded, 
   show a message instead of the image: "Select a building with an uploaded floor plan first"
8. The "Add venue" submit button uses the xPercent/yPercent captured from the image 
   click, not from any text field

### Entrance point (on the Building form):
Same click-based approach — after a floor plan is uploaded for a building, show 
it with instructions "Click to mark the entrance point" and capture 
entranceXPercent/entranceYPercent the same way as venue positions above.

## ISSUE 4: Fix low text contrast (dark text on dark background)

Sweep these pages for contrast issues where text is barely visible:
1. College dashboard — the fest name heading ("YouthFest" in the example) 
   is nearly invisible against its background
2. Any other headings/labels using var(--text) where the background behind 
   them might be dark while text is also dark, or vice versa

Fix: ensure heading text explicitly uses `color: var(--text)` and sits on 
`var(--bg)` or `var(--surface)` backgrounds consistently — check for any 
hardcoded dark text colors left over from a previous theme iteration that 
don't reference the CSS variables.

## ISSUE 5: Slow loading performance

Investigate and fix slow page load times:
1. Check if any pages are fetching data sequentially when they could run in 
   parallel (use Promise.all for independent fetch calls)
2. Check if the Leaflet map component is being loaded eagerly instead of lazily 
   on pages where it's not immediately visible — ensure dynamic import with 
   ssr:false and a loading fallback is used everywhere Leaflet appears
3. Check if ParticleBackground canvas animation is running on every page including 
   ones where it's not needed, causing unnecessary CPU usage
4. Check Prisma queries in API routes for any N+1 query patterns (e.g. looping 
   and querying inside a loop instead of using include/select to fetch related 
   data in one query)
5. Add loading skeletons or spinners where currently the page shows nothing 
   while waiting, so it at least feels faster even if actual load time doesn't 
   change much
6. Report which specific things were found to be slow and what was fixed

## Testing after all fixes

1. Run npm run dev
2. Go to college dashboard → Map Setup → Buildings tab
3. Add a building by clicking on the mini-map (no typing lat/lng)
4. Go to Venues tab → select the building → click on its floor plan to place a venue
5. Go back to dashboard → Add event → venue dropdown should now show the venue you added
6. Create an event successfully — no "Invalid event data" error
7. Check the theme editor on dashboard — should be AI-only, no manual color pickers
8. Check text contrast is fine everywhere, especially fest name heading
9. Note whether pages feel noticeably faster
10. Run npm run build — zero errors
11. Report done with a summary of what was fixed in each of the 5 issues
