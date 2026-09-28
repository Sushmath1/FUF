# PROMPT: Restructure Buildings/Floor Plans/Venues + Fix Dashboard Layout + Fix CSV Upload
# Large combined prompt. Work through in order. Stop and confirm after each section if context runs low.

## SECTION 1: Simplify "Add Building" to name only

On the map-setup page, Buildings tab:

1. Remove the GPS mini-map from the Add Building form entirely — no map component 
   here at all
2. Remove any floor plan image upload from this form
3. Remove latitude/longitude fields if any remain
4. The Add Building form should contain ONLY:
   - A clearly labeled text input: "Building name" (e.g. "Main Block", "CSE Block")
   - Optional: "Short name" text input, clearly labeled, with helper text 
     "A short label shown on maps, e.g. CSE"
   - Submit button: "Add building"
5. Update the Building creation API route to not require lat/lng or floorPlanUrl 
   anymore — these fields become fully optional/unused at the building level 
   (floor plans move to a separate entity, see Section 2)
6. Every input box must have a clear label directly above it stating exactly 
   what to enter — no unlabeled number fields or ambiguous placeholders anywhere 
   in this form

## SECTION 2: Restructure floor plans as their own entity, linked to a building

Currently floor plan images are tied 1:1 to a building. Change this so a building 
can have multiple floor plans (one per floor), each uploaded separately.

1. Update prisma/schema.prisma: modify the Building model and add a new Floor model:
   ```prisma
   model Floor {
     id           String   @id @default(cuid())
     buildingId   String
     building     Building @relation(fields: [buildingId], references: [id])
     floorNumber  Int
     floorPlanUrl String
     entranceXPercent Float?
     entranceYPercent Float?
     venues       Venue[]
     createdAt    DateTime @default(now())
   }
   ```
   Update the Building model to include `floors Floor[]` relation, and remove 
   floorPlanUrl/entranceXPercent/entranceYPercent from Building itself if they 
   exist there (that data now lives on Floor instead).
   Update Venue model to reference `floorId` instead of directly referencing 
   building-level floor plan data, if it currently does.
   
   After schema changes: run npx prisma generate and npx prisma db push

   STOP HERE after running these two commands. Do not proceed to step 2 or 
   any further section yet. Paste the exact terminal output from npx prisma 
   db push in your response and wait for the user to confirm it looks correct 
   before continuing. Specifically call out whether the output shows 
   "Your database is now in sync with your Prisma schema" (success) or any 
   error/warning text (failure) — if there is any error, warning about data 
   loss, or anything other than a clean success message, do NOT proceed 
   further and instead explain what the error means and wait for instructions.

2. Create a new "Add Floor Plan" section (can be its own tab alongside Buildings 
   and Venues on the map-setup page, or a clearly separated section within the 
   Buildings tab — your choice, whichever fits the existing page structure better):
   - Label: "Select building" — dropdown of existing buildings (created in Section 1)
   - Label: "Floor number" — number input with clear label, e.g. "Which floor is this? (e.g. 1 for ground floor, 2 for first floor)"
   - Label: "Upload floor plan image" — file upload button (JPG/PNG), NOT a text 
     field asking for a URL
   - Optional: click-to-mark entrance point on the uploaded image once it's shown 
     (reuse the existing click-to-capture-percentage logic already built for venues)
   - Submit button: "Add floor plan"
   - A building's floor count is NOT asked for upfront anywhere — it's simply 
     derived from however many Floor records get created for that building. 
     Show a running list like "CSE Block — 2 floors added" wherever buildings 
     are listed, calculated from the actual Floor records.

3. Create the corresponding API routes:
   - POST /api/colleges/[id]/floors — create a floor plan (buildingId, floorNumber, floorPlanUrl)
   - GET /api/colleges/[id]/floors — list floor plans, optionally filtered by buildingId

## SECTION 3: Update "Add Venue" to select building + floor, show them clearly

1. The Add Venue form should have, in this order, each clearly labeled:
   - "Venue name" — text input, e.g. "Lab 2"
   - "Select building" — dropdown of buildings
   - "Select floor" — dropdown that populates based on the selected building, 
     showing only floors that have been added for that building (e.g. "Floor 1", 
     "Floor 2"), pulled from the Floor records created in Section 2
   - Once both building and floor are selected, show that floor's uploaded 
     floor plan image below, with the existing "click on the image to place 
     a pin" interaction already built — this captures xPercent/yPercent 
     on the Floor's image, and the venue record stores floorId + xPercent + yPercent
   - If no floor plan exists yet for the selected building, show a message: 
     "No floor plans added for this building yet. Add one from the Buildings 
     tab first." instead of a broken/empty image area
2. Update the venue creation API route accordingly to accept floorId instead of 
   (or alongside) buildingId
3. Anywhere venues are listed (dashboard, event creation dropdown, etc.), show 
   the building name and floor number next to the venue name, e.g. 
   "Lab 2 — CSE Block, Floor 1" so it's always clear where a venue is located

## SECTION 4: Fix the broken dashboard two-column layout

The college dashboard currently shows a large empty/blank left column with all 
content crammed into the right column only — this is broken, not just a mobile 
issue.

1. Investigate why the left column (which should contain the event list) is 
   rendering empty — check if the events array is empty because no events 
   exist yet (in which case show a proper empty state, not blank space) OR 
   if there's an actual rendering/layout bug where content exists but isn't 
   displaying
2. If events list is genuinely empty (no events added yet), show a clear 
   empty state in the left column: an icon, text like "No events yet", and 
   a prominent "Add your first event" button — never leave it as blank empty space
3. Fix the two-column grid/flex layout so both columns render their content 
   correctly on desktop first, then confirm on mobile
4. On mobile (under 640px), stack the two columns vertically: event list 
   section first (since it's the primary content), then the settings/CSV/stats 
   sidebar content below it — full width, centered padding, no horizontal overflow
5. Make sure the "+ Add event" button remains clearly visible and prominent 
   in both desktop and mobile layouts

## SECTION 5: Fix CSV upload — file upload, not paste-text

The current "Upload CSV" section shows a textarea asking to paste CSV data as 
text. Replace this with an actual file upload:

1. Replace the textarea with a proper file input:
   ```typescript
   <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
     Upload registration CSV file
   </label>
   <input 
     type="file" 
     accept=".csv"
     onChange={handleCsvFileUpload}
   />
   <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
     File must have columns: eventName, email, phone (phone optional if email provided, and vice versa)
   </p>
   ```
2. Implement handleCsvFileUpload to read the selected file using FileReader, 
   parse the CSV text into rows (simple split by comma and newline is fine, 
   or use a lightweight parsing approach — no need for a heavy CSV library), 
   convert to the array of {eventName, email, phone} objects the existing 
   POST /api/colleges/[id]/preregistered endpoint expects, and submit it 
   the same way the old paste-based version did
3. Show upload progress/loading state while processing, then show the 
   matched/unmatched results exactly as before
4. Keep the helper text explaining the expected CSV format clearly visible 
   above the upload button

## Testing after all sections

1. Run npm run dev
2. Go to Map Setup → Buildings tab → Add a building with just a name — confirm 
   no map, no image upload, just name field(s)
3. Add a floor plan for that building — select building, floor number, upload 
   image — confirm it's a real file upload button
4. Go to Venues tab → select building → select floor → confirm the floor's 
   image shows and you can click to place a pin
5. Go to dashboard → confirm left column shows either events or a proper 
   empty state, not blank space
6. Confirm dashboard looks correct on both desktop and mobile width (375px)
7. Confirm CSV upload is a file picker, not a paste box
8. Run npm run build — zero errors
9. Report done, summarize what was completed in each section
