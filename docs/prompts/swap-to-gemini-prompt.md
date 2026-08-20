# PROMPT: Swap Anthropic Claude for Google Gemini (free tier)

## Context
Replace all 4 AI features (theme generation, chatbot, auto-schedule, recommendations) 
from using Anthropic's Claude API to Google's Gemini API, since Gemini has a genuinely 
free tier suitable for testing and light production use on a college project.

## STEP 1: Get a free Gemini API key (do this yourself first)
1. Go to aistudio.google.com
2. Sign in with any Google account
3. Click "Get API key" → "Create API key"
4. Copy the key

Add to .env.local:
```
GEMINI_API_KEY=paste_your_key_here
```

Remove or leave ANTHROPIC_API_KEY as unused — it's no longer needed.

## STEP 2: Install the Gemini SDK
```bash
npm install @google/generative-ai --legacy-peer-deps
```

## STEP 3: Replace src/lib/anthropic.ts with src/lib/gemini.ts

Delete src/lib/anthropic.ts and create src/lib/gemini.ts:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const globalForGemini = globalThis as unknown as { gemini: GoogleGenerativeAI | undefined }

export const gemini =
  globalForGemini.gemini ??
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

if (process.env.NODE_ENV !== 'production') globalForGemini.gemini = gemini

// Helper to get a model instance — use flash for speed/free tier friendliness
export function getModel(modelName: 'gemini-2.0-flash' | 'gemini-2.0-flash-lite' = 'gemini-2.0-flash') {
  return gemini.getGenerativeModel({ model: modelName })
}
```

## STEP 4: Update src/app/api/ai/generate-theme/route.ts

Replace the Anthropic call with Gemini function calling:

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getModel } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') return err('Unauthorized', 401)

    if (!rateLimit(`theme-gen:${session.user.id}`, 10, 3600000).success)
      return err('Too many theme generations. Try again later.', 429)

    const { description, collegeId } = await request.json()
    if (!description || typeof description !== 'string') return err('Description required', 400)
    if (description.length > 300) return err('Description too long', 400)
    if (session.user.id !== collegeId) return err('Forbidden', 403)

    const model = getModel('gemini-2.0-flash')

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a light-theme UI color palette for a college fest with this description: "${description}".
The background must be very light/cream (like #fff6ef range). The primary color should be vivid warm and match the vibe.

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
particleStyle must be one of: dots, stars, sparks, petals, bubbles`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    })

    const responseText = result.response.text()
    let theme
    try {
      theme = JSON.parse(responseText)
    } catch {
      return err('Theme generation failed — invalid response format', 500)
    }

    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    const colorFields = ['primaryColor', 'secondaryColor', 'accentColor', 'bgColor', 'surfaceColor']
    for (const field of colorFields) {
      if (!hexRegex.test(theme[field])) return err('AI returned invalid color format', 500)
    }

    await prisma.college.update({
      where: { id: collegeId },
      data: {
        themeDescription: description,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        bgColor: theme.bgColor,
        surfaceColor: theme.surfaceColor,
        fontStyle: theme.fontStyle,
        moodText: theme.moodText,
        particleStyle: theme.particleStyle,
      },
    })

    return ok({ theme, description })
  } catch (e) { return serverErr(e) }
}
```

## STEP 5: Update src/app/api/ai/ask/route.ts

```typescript
import { NextRequest } from 'next/server'
import { getModel } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`chatbot:${getClientIp(request)}`, 30, 3600000).success)
      return err('Too many questions. Try again later.', 429)

    const { question, visitorId, guestSessionId, collegeId } = await request.json()
    if (!question || typeof question !== 'string') return err('Question required', 400)
    if (question.length > 200) return err('Question too long', 400)
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const registrations = await prisma.registration.findMany({
      where: visitorId ? { visitorId, collegeId } : { guestSessionId, collegeId },
      include: { event: { include: { venue: { include: { building: true } } } } },
      orderBy: { event: { startTime: 'asc' } },
    })

    const scheduleContext = registrations.map(r => ({
      event: r.event.name,
      venue: r.event.venue.name,
      building: r.event.venue.building?.name ?? null,
      startTime: r.event.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      endTime: r.event.endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: r.event.status,
      contact: r.event.contactName ?? null,
    }))

    const model = getModel('gemini-2.0-flash-lite')

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are a helpful fest navigation assistant for FindUrFest.
Answer questions about the visitor's schedule concisely and helpfully.
Only answer based on the schedule data provided. If something is not in the schedule, say so honestly.
Keep answers under 2 sentences. Be friendly and conversational.
Today's date: ${new Date().toLocaleDateString('en-IN')}

My schedule:
${JSON.stringify(scheduleContext, null, 2)}

Question: ${question}`
        }]
      }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 150 },
    })

    const answer = result.response.text() || 'Sorry, I could not answer that. Please check your schedule directly.'

    return ok({ answer })
  } catch (e) { return serverErr(e) }
}
```

## STEP 6: Update src/app/api/ai/auto-schedule/route.ts

Replace only the AI call section (keep all the deterministic conflict-tagging code the same):

```typescript
import { NextRequest } from 'next/server'
import { getModel } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`auto-schedule:${getClientIp(request)}`, 5, 3600000).success)
      return err('Too many requests. Try again later.', 429)

    const { interests, collegeId } = await request.json()
    if (!interests || typeof interests !== 'string') return err('Please describe your interests', 400)
    if (!collegeId) return err('College ID required', 400)

    const allEvents = await prisma.event.findMany({
      where: { collegeId, status: { not: 'CANCELLED' } },
      include: { venue: true },
      orderBy: { startTime: 'asc' },
    })

    if (allEvents.length === 0) return ok({ suggestedEvents: [], reasoning: 'No events available at this fest.' })

    const eventsWithConflicts = allEvents.map(event => ({
      id: event.id,
      name: event.name,
      category: event.category,
      description: event.description,
      venueName: event.venue.name,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      conflictsWith: allEvents
        .filter(other => other.id !== event.id && event.startTime < other.endTime && event.endTime > other.startTime)
        .map(other => other.id),
    }))

    const model = getModel('gemini-2.0-flash')

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Visitor interests: "${interests}"

Available events (each lists which other events it conflicts with by ID):
${JSON.stringify(eventsWithConflicts, null, 2)}

Pick events that:
1. Best match the visitor's interests
2. Do NOT include two events that appear in each other's conflictsWith list
3. Leave reasonable time between events where possible

Respond ONLY with valid JSON in exactly this shape, no markdown, no extra text:
{
  "selectedEventIds": ["id1", "id2"],
  "reasoning": "one sentence explaining the picks"
}`
        }]
      }],
      generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
    })

    let parsed
    try {
      parsed = JSON.parse(result.response.text())
    } catch {
      return err('Could not generate schedule. Please try again.', 500)
    }

    const { selectedEventIds, reasoning } = parsed as { selectedEventIds: string[]; reasoning: string }

    // Safety re-validation in code — never trust AI output blindly
    const selected = eventsWithConflicts.filter(e => selectedEventIds.includes(e.id))
    const validatedIds = new Set<string>()
    for (const event of selected) {
      const conflictsWithAlreadySelected = event.conflictsWith.some(cId => validatedIds.has(cId))
      if (!conflictsWithAlreadySelected) validatedIds.add(event.id)
    }

    const finalEvents = allEvents
      .filter(e => validatedIds.has(e.id))
      .map(e => ({
        id: e.id, name: e.name, category: e.category,
        venueName: e.venue.name,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
      }))

    return ok({ suggestedEvents: finalEvents, reasoning, isDraft: true })
  } catch (e) { return serverErr(e) }
}
```

## STEP 7: Update src/app/api/ai/recommend/route.ts

Replace only the AI ranking section (keep the deterministic free-time-gap filtering the same):

```typescript
import { NextRequest } from 'next/server'
import { getModel } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`recommend:${getClientIp(request)}`, 10, 3600000).success)
      return err('Too many requests. Try again later.', 429)

    const { collegeId, visitorId, guestSessionId } = await request.json()
    if (!collegeId) return err('College ID required', 400)
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const registered = await prisma.registration.findMany({
      where: { collegeId, ...(visitorId ? { visitorId } : { guestSessionId }) },
      include: { event: { include: { venue: true } } },
    })

    const registeredIds = registered.map(r => r.eventId)
    const others = await prisma.event.findMany({
      where: { collegeId, id: { notIn: registeredIds }, status: { not: 'CANCELLED' } },
      include: { venue: true },
    })

    if (others.length === 0) return ok({ recommendations: [] })

    const sortedRegistered = registered
      .map(r => r.event)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const fitsInGap = (event: any) => {
      if (sortedRegistered.length === 0) return true
      if (event.endTime <= sortedRegistered[0].startTime) return true
      if (event.startTime >= sortedRegistered[sortedRegistered.length - 1].endTime) return true
      for (let i = 0; i < sortedRegistered.length - 1; i++) {
        if (event.startTime >= sortedRegistered[i].endTime && event.endTime <= sortedRegistered[i + 1].startTime) return true
      }
      return false
    }

    const candidates = others.filter(fitsInGap)
    if (candidates.length === 0) return ok({ recommendations: [] })

    const model = getModel('gemini-2.0-flash-lite')

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Visitor is attending: ${registered.map(r => r.event.name).join(', ') || 'no events yet'}

Events that fit in their free time slots:
${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.name, category: c.category, venue: c.venue.name })))}

Pick top 3 most relevant. Give a short reason for each.

Respond ONLY with valid JSON in exactly this shape, no markdown, no extra text:
{
  "recommendations": [
    { "eventId": "id", "reason": "short reason" }
  ]
}
Maximum 3 items in the array.`
        }]
      }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    })

    let parsed
    try {
      parsed = JSON.parse(result.response.text())
    } catch {
      return ok({ recommendations: [] })
    }

    const { recommendations } = parsed as { recommendations: { eventId: string; reason: string }[] }

    const enriched = recommendations
      .map(rec => {
        const event = candidates.find(c => c.id === rec.eventId)
        if (!event) return null
        return {
          eventId: event.id, eventName: event.name, category: event.category,
          venueName: event.venue.name,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          reason: rec.reason,
        }
      })
      .filter(Boolean)

    return ok({ recommendations: enriched })
  } catch (e) { return serverErr(e) }
}
```

## STEP 8: Clean up

```bash
npm uninstall @anthropic-ai/sdk
```

Remove ANTHROPIC_API_KEY line from .env.local and .env.example, replace with GEMINI_API_KEY.

## After all changes

1. Run npm run dev
2. Test theme generation on college register Step 2 — type a description, click generate, should return colors within a few seconds
3. Test the chatbot on visitor schedule page
4. Run npm run build — zero errors
5. Report done

## Notes on Gemini free tier limits
Gemini 2.0 Flash free tier allows 15 requests per minute and 1500 requests per day — 
more than enough for testing and a single college fest. If you ever exceed this, 
requests will return a 429 error which the app already handles gracefully with 
rate limiting messages.
