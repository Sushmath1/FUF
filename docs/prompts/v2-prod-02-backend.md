# PROMPT 2: Backend — All API Endpoints + AI Routes
# FindUrFest — Full production build with AI

## Prerequisites
Prompt 1 fully complete. All lib files exist.

---

## FILE: src/lib/pusher.ts

```typescript
import Pusher from 'pusher'

let instance: Pusher | null = null

function getPusher() {
  if (!instance) {
    instance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  return instance
}

export async function notifyVenueChange(eventId: string, newVenueName: string, previousVenueName: string) {
  try {
    await getPusher().trigger(`event-${eventId}`, 'venue-changed', {
      eventId, newVenueName, previousVenueName, changedAt: new Date().toISOString(),
    })
  } catch (e) { console.error('[Pusher] notifyVenueChange failed:', e) }
}

export async function notifyEventCancelled(eventId: string, eventName: string) {
  try {
    await getPusher().trigger(`event-${eventId}`, 'event-cancelled', {
      eventId, eventName, cancelledAt: new Date().toISOString(),
    })
  } catch (e) { console.error('[Pusher] notifyEventCancelled failed:', e) }
}
```

---

## FILE: src/app/api/colleges/search/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!rateLimit(`search:${ip}`, 30, 60000).success) return err('Too many requests', 429)

    const q = new URL(request.url).searchParams.get('q')?.trim()
    if (!q || q.length < 2) return ok({ colleges: [] })

    const colleges = await prisma.college.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { festName: { contains: q, mode: 'insensitive' } },
          { shortName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, name: true, shortName: true, festName: true, festTagline: true,
        logoUrl: true, bannerUrl: true, festStartDate: true, festEndDate: true,
        primaryColor: true, secondaryColor: true, accentColor: true,
        bgColor: true, moodText: true,
      },
      take: 10,
      orderBy: { festStartDate: 'desc' },
    })

    return ok({ colleges })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const college = await prisma.college.findUnique({
      where: { id: params.id },
      select: {
        id: true, name: true, shortName: true, festName: true, festTagline: true,
        logoUrl: true, bannerUrl: true, mapImageUrl: true,
        mainGateLat: true, mainGateLng: true,
        contactName: true, contactNumber: true,
        festStartDate: true, festEndDate: true,
        primaryColor: true, secondaryColor: true, accentColor: true,
        bgColor: true, surfaceColor: true, fontStyle: true,
        moodText: true, particleStyle: true, themeDescription: true,
        buildings: {
          select: {
            id: true, name: true, shortName: true, lat: true, lng: true,
            floorPlanUrl: true, entranceXPercent: true, entranceYPercent: true, floors: true,
            venues: {
              select: { id: true, name: true, floor: true, xPercent: true, yPercent: true, lat: true, lng: true, capacity: true },
            },
          },
        },
        venues: {
          where: { buildingId: null },
          select: { id: true, name: true, lat: true, lng: true, capacity: true },
        },
      },
    })
    if (!college) return err('College not found', 404)
    return ok(college)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/theme/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const college = await prisma.college.update({
      where: { id: params.id },
      data: {
        themeDescription: body.themeDescription,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        bgColor: body.bgColor,
        surfaceColor: body.surfaceColor,
        fontStyle: body.fontStyle,
        moodText: body.moodText,
        particleStyle: body.particleStyle,
      },
    })
    return ok(college)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/buildings/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { buildingSchema } from '@/lib/validations'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const buildings = await prisma.building.findMany({
      where: { collegeId: params.id },
      include: { venues: { select: { id: true, name: true, floor: true, xPercent: true, yPercent: true, capacity: true } } },
      orderBy: { name: 'asc' },
    })
    return ok({ buildings })
  } catch (e) { return serverErr(e) }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const result = buildingSchema.safeParse(body)
    if (!result.success) return err('Invalid building data', 400)

    const building = await prisma.building.create({ data: { ...result.data, collegeId: params.id } })
    return ok(building, 201)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/buildings/[buildingId]/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function PATCH(request: NextRequest, { params }: { params: { id: string; buildingId: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const building = await prisma.building.update({
      where: { id: params.buildingId, collegeId: params.id },
      data: {
        name: body.name, shortName: body.shortName, lat: body.lat, lng: body.lng,
        floorPlanUrl: body.floorPlanUrl, entranceXPercent: body.entranceXPercent,
        entranceYPercent: body.entranceYPercent, floors: body.floors,
      },
    })
    return ok(building)
  } catch (e) { return serverErr(e) }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; buildingId: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const activeEvents = await prisma.event.count({
      where: { venue: { buildingId: params.buildingId }, status: { in: ['SCHEDULED', 'CHANGED'] }, endTime: { gt: new Date() } },
    })
    if (activeEvents > 0) return err(`Cannot delete building with ${activeEvents} active events. Reassign events first.`, 400)

    await prisma.building.delete({ where: { id: params.buildingId } })
    return ok({ success: true })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/venues/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { venueSchema } from '@/lib/validations'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const venues = await prisma.venue.findMany({
      where: { collegeId: params.id },
      include: {
        building: { select: { id: true, name: true } },
        events: {
          where: { status: { in: ['SCHEDULED', 'CHANGED'] }, endTime: { gt: new Date() } },
          select: { id: true, name: true, startTime: true, endTime: true },
          take: 1, orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ building: { name: 'asc' } }, { name: 'asc' }],
    })
    return ok({ venues })
  } catch (e) { return serverErr(e) }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const result = venueSchema.safeParse(body)
    if (!result.success) return err('Invalid venue data', 400)

    const venue = await prisma.venue.create({ data: { ...result.data, collegeId: params.id } })
    return ok(venue, 201)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/events/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { eventSchema } from '@/lib/validations'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const events = await prisma.event.findMany({
      where: { collegeId: params.id, ...(category ? { category: category as any } : {}) },
      include: { venue: { include: { building: { select: { name: true, lat: true, lng: true } } } } },
      orderBy: { startTime: 'asc' },
    })
    return ok({ events })
  } catch (e) { return serverErr(e) }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const result = eventSchema.safeParse(body)
    if (!result.success) return err('Invalid event data', 400)

    const { venueId, startTime, endTime, ...rest } = result.data

    if (new Date(endTime) <= new Date(startTime)) return err('End time must be after start time', 400)

    const venue = await prisma.venue.findFirst({ where: { id: venueId, collegeId: params.id } })
    if (!venue) return err('Venue not found', 404)

    const event = await prisma.event.create({
      data: { ...rest, venueId, startTime: new Date(startTime), endTime: new Date(endTime), collegeId: params.id },
      include: { venue: true },
    })
    return ok(event, 201)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/events/[eventId]/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/apiHelpers'
import { notifyVenueChange, notifyEventCancelled } from '@/lib/pusher'

export async function GET(_: NextRequest, { params }: { params: { id: string; eventId: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: { venue: { include: { building: true } } },
    })
    if (!event || event.collegeId !== params.id) return err('Event not found', 404)
    return ok(event)
  } catch (e) { return serverErr(e) }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; eventId: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    const body = await request.json()
    const existing = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: { venue: true },
    })
    if (!existing || existing.collegeId !== params.id) return err('Event not found', 404)

    const data: any = {}
    let venueChanged = false
    const previousVenueName = existing.venue.name

    if (body.venueId && body.venueId !== existing.venueId) {
      const newVenue = await prisma.venue.findFirst({ where: { id: body.venueId, collegeId: params.id } })
      if (!newVenue) return err('Venue not found', 404)
      venueChanged = true
      data.venueId = body.venueId
      data.status = 'CHANGED'
      data.lastVenueChangeAt = new Date()
      data.previousVenueName = previousVenueName
    }

    if (body.status === 'CANCELLED') {
      if (existing.endTime < new Date()) return err('Event already ended', 400)
      data.status = 'CANCELLED'
    }

    if (body.startTime) data.startTime = new Date(body.startTime)
    if (body.endTime) data.endTime = new Date(body.endTime)
    if (body.name) data.name = body.name
    if (body.contactName !== undefined) data.contactName = body.contactName
    if (body.contactNumber !== undefined) data.contactNumber = body.contactNumber
    if (body.description !== undefined) data.description = body.description

    const updated = await prisma.event.update({
      where: { id: params.eventId },
      data,
      include: { venue: true },
    })

    if (venueChanged) await notifyVenueChange(params.eventId, updated.venue.name, previousVenueName)
    if (body.status === 'CANCELLED') await notifyEventCancelled(params.eventId, existing.name)

    return ok(updated)
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/colleges/[id]/preregistered/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== params.id)
      return err('Unauthorized', 401)

    if (!rateLimit(`csv:${params.id}`, 10, 3600000).success)
      return err('Too many uploads. Try again later.', 429)

    const { entries } = await request.json()
    if (!Array.isArray(entries)) return err('Invalid format', 400)
    if (entries.length > 5000) return err('Maximum 5000 entries per upload', 400)

    const events = await prisma.event.findMany({ where: { collegeId: params.id }, select: { id: true, name: true } })
    const eventMap = new Map(events.map(e => [e.name.toLowerCase().trim(), e.id]))

    const toCreate: any[] = []
    const unmatched: string[] = []

    for (const entry of entries) {
      const eventName = String(entry.eventName ?? '').toLowerCase().trim()
      const eventId = eventMap.get(eventName)
      if (!eventId) { if (!unmatched.includes(entry.eventName)) unmatched.push(entry.eventName); continue }
      const email = entry.email?.toLowerCase().trim() || null
      const phone = entry.phone?.replace(/\D/g, '').slice(-10) || null
      if (!email && !phone) continue
      toCreate.push({ collegeId: params.id, eventId, eventName: entry.eventName, email, phone })
    }

    let matched = 0
    for (let i = 0; i < toCreate.length; i += 500) {
      const result = await prisma.preRegisteredEntry.createMany({ data: toCreate.slice(i, i + 500), skipDuplicates: true })
      matched += result.count
    }

    return ok({ matched, unmatched, total: entries.length })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/visitors/verify/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySchema } from '@/lib/validations'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`verify:${getClientIp(request)}`, 10, 300000).success)
      return err('Too many attempts. Try again in 5 minutes.', 429)

    const body = await request.json()
    const result = verifySchema.safeParse(body)
    if (!result.success) return err('Please provide your email or phone number', 400)

    const { collegeId, email, phone } = result.data
    const { visitorId, guestSessionId } = body
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const normalizedEmail = email?.toLowerCase().trim()
    const normalizedPhone = phone?.replace(/\D/g, '').slice(-10)
    const orConds = []
    if (normalizedEmail) orConds.push({ email: normalizedEmail })
    if (normalizedPhone) orConds.push({ phone: normalizedPhone })

    const entries = await prisma.preRegisteredEntry.findMany({
      where: { collegeId, matched: false, OR: orConds },
    })

    if (entries.length === 0) {
      return ok({ found: 0, events: [], message: 'No registered events found. Try your other email or phone number.' })
    }

    const registeredEvents = []
    for (const entry of entries) {
      try {
        await prisma.registration.create({
          data: { eventId: entry.eventId, collegeId, ...(visitorId ? { visitorId } : { guestSessionId }) },
        })
        await prisma.preRegisteredEntry.update({ where: { id: entry.id }, data: { matched: true } })
        const event = await prisma.event.findUnique({
          where: { id: entry.eventId },
          include: { venue: { include: { building: true } } },
        })
        if (event) {
          registeredEvents.push({
            id: event.id, name: event.name, category: event.category,
            venueName: event.venue.name, buildingName: event.venue.building?.name,
            startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString(),
            contactName: event.contactName, contactNumber: event.contactNumber,
          })
        }
      } catch { /* already registered */ }
    }

    return ok({ found: registeredEvents.length, events: registeredEvents })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/visitors/[id]/schedule/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const type = new URL(request.url).searchParams.get('type')
    const registrations = await prisma.registration.findMany({
      where: type === 'guest' ? { guestSessionId: params.id } : { visitorId: params.id },
      include: { event: { include: { venue: { include: { building: true } } } } },
      orderBy: { event: { startTime: 'asc' } },
    })

    if (registrations.length === 0) return ok({ events: [], lastSyncedAt: new Date().toISOString() })

    const collegeId = registrations[0].collegeId
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      select: {
        id: true, name: true, shortName: true, festName: true,
        contactName: true, contactNumber: true,
        primaryColor: true, secondaryColor: true, accentColor: true,
        bgColor: true, surfaceColor: true, fontStyle: true,
        moodText: true, particleStyle: true,
      },
    })

    const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000)
    const events = []

    for (let i = 0; i < registrations.length; i++) {
      const { event } = registrations[i]
      const nextEvent = registrations[i + 1]?.event

      let walkMinutesToNext = null
      let tightWalk = false
      let conflictWithEventId = null

      if (nextEvent) {
        if (event.endTime > nextEvent.startTime) conflictWithEventId = nextEvent.id
        const distance = await prisma.venueDistance.findFirst({
          where: { OR: [{ fromVenueId: event.venueId, toVenueId: nextEvent.venueId }, { fromVenueId: nextEvent.venueId, toVenueId: event.venueId }] },
        })
        if (distance) {
          walkMinutesToNext = distance.walkMinutes
          tightWalk = (nextEvent.startTime.getTime() - event.endTime.getTime()) / 60000 < distance.walkMinutes
        }
      }

      events.push({
        id: event.id, name: event.name, description: event.description, category: event.category,
        venueName: event.venue.name, buildingName: event.venue.building?.name ?? null,
        buildingShortName: event.venue.building?.shortName ?? null,
        venueLat: event.venue.lat ?? event.venue.building?.lat ?? null,
        venueLng: event.venue.lng ?? event.venue.building?.lng ?? null,
        venueFloorPlanUrl: event.venue.building?.floorPlanUrl ?? null,
        venueXPercent: event.venue.xPercent, venueYPercent: event.venue.yPercent,
        entranceXPercent: event.venue.building?.entranceXPercent ?? null,
        entranceYPercent: event.venue.building?.entranceYPercent ?? null,
        floor: event.venue.floor,
        startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString(),
        status: event.status,
        contactName: event.contactName ?? college?.contactName ?? null,
        contactNumber: event.contactNumber ?? college?.contactNumber ?? null,
        walkMinutesToNext, tightWalk,
        venueJustChanged: event.lastVenueChangeAt ? event.lastVenueChangeAt > sixtyMinsAgo : false,
        previousVenueName: event.previousVenueName,
        conflictWithEventId,
      })
    }

    return ok({
      collegeId, collegeName: college?.name ?? '', festName: college?.festName ?? '',
      theme: {
        primaryColor: college?.primaryColor, secondaryColor: college?.secondaryColor,
        accentColor: college?.accentColor, bgColor: college?.bgColor,
        surfaceColor: college?.surfaceColor, fontStyle: college?.fontStyle,
        moodText: college?.moodText, particleStyle: college?.particleStyle,
      },
      events, lastSyncedAt: new Date().toISOString(),
    })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/visitors/[id]/history/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'visitor' || session.user.id !== params.id)
      return err('Please log in to view your history', 401)

    const registrations = await prisma.registration.findMany({
      where: { visitorId: params.id },
      include: { event: { include: { venue: true } } },
      orderBy: { event: { startTime: 'desc' } },
    })

    const grouped = new Map<string, any>()
    for (const reg of registrations) {
      if (!grouped.has(reg.collegeId)) {
        const college = await prisma.college.findUnique({
          where: { id: reg.collegeId },
          select: { name: true, festName: true, festStartDate: true },
        })
        grouped.set(reg.collegeId, { collegeId: reg.collegeId, collegeName: college?.name, festName: college?.festName, festDate: college?.festStartDate, events: [] })
      }
      grouped.get(reg.collegeId).events.push({ name: reg.event.name, venueName: reg.event.venue.name, startTime: reg.event.startTime })
    }

    return ok({ history: Array.from(grouped.values()) })
  } catch (e) { return serverErr(e) }
}
```

---

## FILE: src/app/api/venue-distances/route.ts

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ok, err, serverErr } from '@/lib/apiHelpers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') return err('Unauthorized', 401)

    const { fromVenueId, toVenueId, walkMinutes } = await request.json()
    if (!fromVenueId || !toVenueId || typeof walkMinutes !== 'number') return err('Missing fields', 400)
    if (walkMinutes < 1 || walkMinutes > 60) return err('walkMinutes must be 1-60', 400)

    const venues = await prisma.venue.findMany({ where: { id: { in: [fromVenueId, toVenueId] }, collegeId: session.user.id } })
    if (venues.length !== 2) return err('Venues not found', 404)

    const existing = await prisma.venueDistance.findFirst({
      where: { OR: [{ fromVenueId, toVenueId }, { fromVenueId: toVenueId, toVenueId: fromVenueId }] },
    })

    const result = existing
      ? await prisma.venueDistance.update({ where: { id: existing.id }, data: { walkMinutes } })
      : await prisma.venueDistance.create({ data: { fromVenueId, toVenueId, walkMinutes } })

    return ok(result)
  } catch (e) { return serverErr(e) }
}
```

---

## AI ROUTE 1: src/app/api/ai/generate-theme/route.ts
College types a description, AI generates a full color palette

```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      tools: [{
        name: 'generate_theme',
        description: 'Generate a complete UI color theme from a description',
        input_schema: {
          type: 'object' as const,
          properties: {
            primaryColor: { type: 'string', description: 'Main accent color as hex e.g. #06b6d4' },
            secondaryColor: { type: 'string', description: 'Secondary accent as hex' },
            accentColor: { type: 'string', description: 'Small highlights as hex' },
            bgColor: { type: 'string', description: 'Page background hex — must be very dark for dark theme' },
            surfaceColor: { type: 'string', description: 'Card/surface background hex — slightly lighter than bg' },
            fontStyle: { type: 'string', enum: ['monospace', 'serif', 'modern', 'futuristic', 'traditional'] },
            moodText: { type: 'string', description: 'Short 3-5 word tagline matching the vibe e.g. Hack the future' },
            particleStyle: { type: 'string', enum: ['dots', 'stars', 'sparks', 'petals', 'bubbles'] },
          },
          required: ['primaryColor', 'secondaryColor', 'accentColor', 'bgColor', 'surfaceColor', 'fontStyle', 'moodText', 'particleStyle'],
        },
      }],
      tool_choice: { type: 'tool', name: 'generate_theme' },
      messages: [{
        role: 'user',
        content: `Generate a dark-theme UI color palette for a college fest with this description: "${description}". 
The background must be very dark (near black). The primary color should be vivid and match the vibe. Make it look impressive and modern.`,
      }],
    })

    const toolResult = response.content.find(b => b.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use') return err('Theme generation failed', 500)

    const theme = toolResult.input as any

    // Validate hex colors
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    const colorFields = ['primaryColor', 'secondaryColor', 'accentColor', 'bgColor', 'surfaceColor']
    for (const field of colorFields) {
      if (!hexRegex.test(theme[field])) return err('AI returned invalid color format', 500)
    }

    // Save to database
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

---

## AI ROUTE 2: src/app/api/ai/ask/route.ts
Visitor Q&A chatbot grounded in their personal schedule

```typescript
import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/anthropic'
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

    // Fetch the visitor's actual schedule as context
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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You are a helpful fest navigation assistant for FindUrFest. 
Answer questions about the visitor's schedule concisely and helpfully.
Only answer based on the schedule data provided. If something is not in the schedule, say so honestly.
Keep answers under 2 sentences. Be friendly and conversational.
Today's date: ${new Date().toLocaleDateString('en-IN')}`,
      messages: [{
        role: 'user',
        content: `My schedule:\n${JSON.stringify(scheduleContext, null, 2)}\n\nQuestion: ${question}`,
      }],
    })

    const answer = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Sorry, I could not answer that. Please check your schedule directly.'

    return ok({ answer })
  } catch (e) { return serverErr(e) }
}
```

---

## AI ROUTE 3: src/app/api/ai/auto-schedule/route.ts
Visitor describes interests, AI picks non-conflicting events

```typescript
import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/anthropic'
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

    // Step 1: Deterministic — get all events and tag conflicts in code
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
      // Conflict list computed in plain code — never trust AI for this
      conflictsWith: allEvents
        .filter(other => other.id !== event.id && event.startTime < other.endTime && event.endTime > other.startTime)
        .map(other => other.id),
    }))

    // Step 2: AI selects based on interests (relevance only — constraint checking already done above)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      tools: [{
        name: 'select_events',
        description: 'Select a non-conflicting set of events matching visitor interests',
        input_schema: {
          type: 'object' as const,
          properties: {
            selectedEventIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Event IDs to include — must not pick two events that conflict with each other',
            },
            reasoning: { type: 'string', description: 'One sentence explaining the picks' },
          },
          required: ['selectedEventIds', 'reasoning'],
        },
      }],
      tool_choice: { type: 'tool', name: 'select_events' },
      messages: [{
        role: 'user',
        content: `Visitor interests: "${interests}"

Available events (each lists which other events it conflicts with by ID):
${JSON.stringify(eventsWithConflicts, null, 2)}

Pick events that:
1. Best match the visitor's interests
2. Do NOT include two events that appear in each other's conflictsWith list
3. Leave reasonable time between events where possible`,
      }],
    })

    const toolResult = response.content.find(b => b.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use') return err('Could not generate schedule. Please try again.', 500)

    const { selectedEventIds, reasoning } = toolResult.input as { selectedEventIds: string[]; reasoning: string }

    // Step 3: Safety re-validation in code — never trust AI output blindly
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

---

## AI ROUTE 4: src/app/api/ai/recommend/route.ts
Suggests events that fit visitor's free time slots

```typescript
import { NextRequest } from 'next/server'
import { anthropic } from '@/lib/anthropic'
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

    // Get visitor's registered events
    const registered = await prisma.registration.findMany({
      where: { collegeId, ...(visitorId ? { visitorId } : { guestSessionId }) },
      include: { event: { include: { venue: true } } },
    })

    // Get all other events not registered for
    const registeredIds = registered.map(r => r.eventId)
    const others = await prisma.event.findMany({
      where: { collegeId, id: { notIn: registeredIds }, status: { not: 'CANCELLED' } },
      include: { venue: true },
    })

    if (others.length === 0) return ok({ recommendations: [] })

    // Deterministic: filter to events that actually fit in free time gaps
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

    // AI ranks by relevance
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      tools: [{
        name: 'rank_recommendations',
        description: 'Rank candidate events by relevance to visitor existing registrations',
        input_schema: {
          type: 'object' as const,
          properties: {
            recommendations: {
              type: 'array',
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  eventId: { type: 'string' },
                  reason: { type: 'string', description: 'Short reason — similar to X or fits between Y and Z' },
                },
                required: ['eventId', 'reason'],
              },
            },
          },
          required: ['recommendations'],
        },
      }],
      tool_choice: { type: 'tool', name: 'rank_recommendations' },
      messages: [{
        role: 'user',
        content: `Visitor is attending: ${registered.map(r => r.event.name).join(', ') || 'no events yet'}

Events that fit in their free time slots:
${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.name, category: c.category, venue: c.venue.name })))}

Pick top 3 most relevant. Give a short reason for each.`,
      }],
    })

    const toolResult = response.content.find(b => b.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use') return ok({ recommendations: [] })

    const { recommendations } = toolResult.input as { recommendations: { eventId: string; reason: string }[] }

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

---

## After building
1. `npm run dev` — no crash
2. Test: POST /api/ai/generate-theme with `{ description: "cyberpunk dark neon", collegeId: "valid-id" }` — should return a full color palette
3. Test: POST /api/ai/ask with a question and a valid schedule — should return a short answer
4. `npm run build` — zero TypeScript errors
5. `git add . && git commit -m "prompt 2 backend + AI routes done"`
