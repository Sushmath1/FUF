import { NextRequest } from 'next/server'

import { ok, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'

type VisitorRouteContext = { params: Promise<{ id: string }> }

type ScheduleEvent = {
  id: string
  name: string
  description: string | null
  category: string
  venueName: string
  buildingName: string | null
  buildingShortName: string | null
  venueLat: number | null
  venueLng: number | null
  venueFloorPlanUrl: string | null
  venueXPercent: number | null
  venueYPercent: number | null
  entranceXPercent: number | null
  entranceYPercent: number | null
  venueDirections: string | null
  floor: number | null
  startTime: string
  endTime: string
  status: string
  contactName: string | null
  contactNumber: string | null
  walkMinutesToNext: number | null
  tightWalk: boolean
  venueJustChanged: boolean
  previousVenueName: string | null
  conflictWithEventId: string | null
}

export async function GET(request: NextRequest, context: VisitorRouteContext) {
  try {
    const { id } = await context.params
    const type = new URL(request.url).searchParams.get('type')

    const registrations = await prisma.registration.findMany({
      where: type === 'guest' ? { guestSessionId: id } : { visitorId: id },
      include: { event: { include: { venue: { include: { floor: { include: { building: true } } } } } } },
      orderBy: { event: { startTime: 'asc' } },
    })

    if (registrations.length === 0) return ok({ events: [], lastSyncedAt: new Date().toISOString() })

    const collegeId = registrations[0].collegeId
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      select: {
        id: true,
        name: true,
        shortName: true,
        festName: true,
        contactName: true,
        contactNumber: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        bgColor: true,
        surfaceColor: true,
        fontStyle: true,
        moodText: true,
        particleStyle: true,
      },
    })

    const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000)
    const events: ScheduleEvent[] = []

    for (let i = 0; i < registrations.length; i++) {
      const event = registrations[i].event
      const nextEvent = registrations[i + 1]?.event

      let walkMinutesToNext: number | null = null
      let tightWalk = false
      let conflictWithEventId: string | null = null

      if (nextEvent) {
        if (event.endTime > nextEvent.startTime) conflictWithEventId = nextEvent.id

        const distance = await prisma.venueDistance.findFirst({
          where: {
            OR: [
              { fromVenueId: event.venueId, toVenueId: nextEvent.venueId },
              { fromVenueId: nextEvent.venueId, toVenueId: event.venueId },
            ],
          },
        })

        if (distance) {
          walkMinutesToNext = distance.walkMinutes
          tightWalk =
            (nextEvent.startTime.getTime() - event.endTime.getTime()) / 60000 < distance.walkMinutes
        }
      }

      events.push({
        id: event.id,
        name: event.name,
        description: event.description,
        category: event.category,
        venueName: event.venue.name,
        buildingName: event.venue.floor?.building?.name ?? null,
        buildingShortName: event.venue.floor?.building?.shortName ?? null,
        venueLat: event.venue.lat ?? event.venue.floor?.building?.lat ?? null,
        venueLng: event.venue.lng ?? event.venue.floor?.building?.lng ?? null,
        venueFloorPlanUrl: event.venue.floor?.floorPlanUrl ?? null,
        venueXPercent: event.venue.xPercent,
        venueYPercent: event.venue.yPercent,
        entranceXPercent: event.venue.floor?.entranceXPercent ?? null,
        entranceYPercent: event.venue.floor?.entranceYPercent ?? null,
        venueDirections: event.venue.directions,
        floor: event.venue.floor?.floorNumber ?? null,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        status: event.status,
        contactName: event.contactName ?? college?.contactName ?? null,
        contactNumber: event.contactNumber ?? college?.contactNumber ?? null,
        walkMinutesToNext,
        tightWalk,
        venueJustChanged: event.lastVenueChangeAt ? event.lastVenueChangeAt > sixtyMinsAgo : false,
        previousVenueName: event.previousVenueName,
        conflictWithEventId,
      })
    }

    return ok({
      collegeId,
      collegeName: college?.name ?? '',
      festName: college?.festName ?? '',
      theme: {
        primaryColor: college?.primaryColor,
        secondaryColor: college?.secondaryColor,
        accentColor: college?.accentColor,
        bgColor: college?.bgColor,
        surfaceColor: college?.surfaceColor,
        fontStyle: college?.fontStyle,
        moodText: college?.moodText,
        particleStyle: college?.particleStyle,
      },
      events,
      lastSyncedAt: new Date().toISOString(),
    })
  } catch (e) {
    return serverErr(e)
  }
}
