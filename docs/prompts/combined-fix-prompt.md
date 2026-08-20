# PROMPT: Fix Theme Generation Error + Realistic Colors + Invalid Input on Submit
# Combined into one prompt to save session usage — do all 3 in order, don't stop between them unless something breaks

## ISSUE 1: Debug and fix theme generation failure

The AI theme generation on college register Step 2 shows "Couldn't generate a theme 
right now" error. Fix this:

1. Open src/app/api/ai/generate-theme/route.ts
2. Add temporary debug logging right before the Gemini API call:
   ```
   console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
   console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length ?? 0)
   ```
3. In the catch block, log the full error instead of swallowing it:
   ```
   console.error('GEMINI THEME GENERATION ERROR:', e)
   ```
4. Check that the model name being used is valid — use 'gemini-2.0-flash' 
   (not 'gemini-2.5-flash' or any preview/experimental name that may not 
   be available on the free tier)
5. Check that responseMimeType: 'application/json' is set correctly in 
   generationConfig — if this Gemini SDK version doesn't support it, remove 
   it and instead parse the response by stripping markdown code fences manually:
   ```typescript
   const rawText = result.response.text()
   const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
   const theme = JSON.parse(cleanedText)
   ```
6. Run npm run dev, test theme generation again, and check the terminal for 
   the actual error message before proceeding to fix it based on what's shown

## ISSUE 2: Make AI-generated colors more realistic

Once generation is working, update the prompt text sent to Gemini to produce 
more cohesive, realistic colors instead of random/neon ones. Replace the prompt 
text inside the generateContent call with:

```
Generate a realistic, cohesive UI color palette for a college fest with this description: "${description}".

Guidelines for realistic colors:
- Colors should look like they belong together, like a professional brand palette, not random bright hex codes
- Primary and secondary colors should be complementary or analogous on the color wheel, not clashing
- The background must be a soft, light, slightly warm or cool neutral (think cream, soft white, pale blue-grey) — never pure white, never harsh
- The surface color should be a very subtle variation of the background (barely different, like a card sitting on a page)
- Accent color should be used sparingly — a small pop of contrast, not another dominant color
- Think of real design systems: Stripe, Airbnb, Notion — muted, tasteful, not saturated neon
- Avoid pure primary colors like #FF0000 or #00FF00 — use realistic tinted versions instead

Respond ONLY with valid JSON in exactly this shape, no markdown formatting, no code fences, no extra text:
{
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "accentColor": "#hexcode",
  "bgColor": "#hexcode",
  "surfaceColor": "#hexcode",
  "fontStyle": "modern",
  "moodText": "3-5 word tagline",
  "particleStyle": "dots"
}
fontStyle must be one of: monospace, serif, modern, futuristic, traditional
particleStyle must be one of: dots, stars, sparks, petals, bubbles
```

Also set temperature to 0.5 in generationConfig for more consistent results.

## ISSUE 3: Fix "Invalid input" error on final registration submit

On Step 5 of college register, submitting shows "Invalid input" error. Fix this:

1. Open src/app/api/colleges/register/route.ts
2. Temporarily add detailed error logging where validation fails:
   ```typescript
   if (!result.success) {
     console.error('REGISTRATION VALIDATION FAILED:', JSON.stringify(result.error.flatten(), null, 2))
     return err(`Invalid input: ${JSON.stringify(result.error.flatten().fieldErrors)}`, 400)
   }
   ```
3. Also log the submitted body right before validation:
   ```typescript
   console.log('SUBMITTED REGISTRATION BODY:', JSON.stringify(body, null, 2))
   ```
4. Check src/lib/validations.ts collegeRegisterSchema — likely culprits to check:
   - festStartDate and festEndDate expect full ISO datetime strings (z.string().datetime()) 
     but the form might be sending just a date like "2026-08-21" without time — if so, 
     either change the schema to accept date-only strings, or convert the date input 
     to full ISO format before sending (e.g. append "T00:00:00.000Z")
   - contactNumber regex expects 10-15 digits/characters — check if the submitted 
     phone number matches this format
   - adminEmail must be a valid email format
   - password must be at least 8 characters
5. Fix the actual mismatch found in the schema or the frontend data formatting — 
   don't just relax validation without understanding what's actually wrong
6. Once fixed, remove all temporary console.log/console.error debug lines added 
   in this prompt (keep the error handling clean, not verbose)

## Testing after all 3 fixes

1. Run npm run dev
2. Go to /college/register
3. Fill Step 1 with test data (any college name, fest name, valid dates, valid 
   10-digit phone, valid email, 8+ character password)
4. Step 2: type a theme description, click Generate — should return realistic 
   cohesive colors within a few seconds, no error
5. Complete Steps 3-4 (can skip map/buildings for now)
6. Step 5: click "Create my account and go to dashboard" — should succeed 
   and redirect to dashboard, no "Invalid input" error
7. Run npm run build — zero errors
8. Report back: what was the root cause of each of the 3 issues
