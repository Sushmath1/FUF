import { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { notifyVenueChange, notifyEventCancelled } from '@/lib/pusher'
import { prisma } from '@/lib/prisma'

type EventRouteContext = { params: Promise<{ id: string; eventId: string }> }

export async function GET(_: NextRequest, context: EventRouteContext) {
  try {
    const { id, eventId } = await context.params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: { include: { floor: { include: { building: true } } } } },
    })
    if (!event || event.collegeId !== id) return err('Event not found', 404)

    return ok(event)
  } catch (e) {
    return serverErr(e)
  }
}

export async function PATCH(request: NextRequest, context: EventRouteContext) {
  try {
    const { id, eventId } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const body = (await request.json()) as {
      venueId?: string
      status?: string
      startTime?: string
      endTime?: string
      name?: string
      contactName?: string | null
      contactNumber?: string | null
      description?: string | null
    }

    const existing = await prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true },
    })
    if (!existing || existing.collegeId !== id) return err('Event not found', 404)

    const data: Prisma.EventUpdateInput = {}
    let venueChanged = false
    const previousVenueName = existing.venue.name

    if (body.venueId && body.venueId !== existing.venueId) {
      const newVenue = await prisma.venue.findFirst({ where: { id: body.venueId, collegeId: id } })
      if (!newVenue) return err('Venue not found', 404)

      venueChanged = true
      data.venue = { connect: { id: body.venueId } }
      data.status = 'CHANGED'
      data.lastVenueChangeAt = new Date()
      data.previousVenueName = previousVenueName
    }

    if (body.status === 'CANCELLED') {
      if (existing.endTime < new Date()) return err('Event already ended', 400)
      data.status = 'CANCELLED'
    }

    const updatedStart = body.startTime ? new Date(body.startTime) : existing.startTime
    const updatedEnd = body.endTime ? new Date(body.endTime) : existing.endTime
    if (updatedEnd <= updatedStart) return err('End time must be after start time', 400)

    if (body.startTime) data.startTime = updatedStart
    if (body.endTime) data.endTime = updatedEnd
    if (body.name) data.name = body.name
    if (body.contactName !== undefined) data.contactName = body.contactName
    if (body.contactNumber !== undefined) data.contactNumber = body.contactNumber
    if (body.description !== undefined) data.description = body.description

    const updated = await prisma.event.update({
      where: { id: eventId },
      data,
      include: { venue: true },
    })

    if (venueChanged) await notifyVenueChange(eventId, updated.venue.name, previousVenueName)
    if (body.status === 'CANCELLED') await notifyEventCancelled(eventId, existing.name)

    return ok(updated)
  } catch (e) {
    return serverErr(e)
  }
}
