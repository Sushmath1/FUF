import { EventCategory } from '@prisma/client'
import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eventSchema } from '@/lib/validations'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params
    const category = new URL(request.url).searchParams.get('category')
    const validCategory =
      category && (Object.values(EventCategory) as string[]).includes(category)
        ? (category as EventCategory)
        : undefined

    const events = await prisma.event.findMany({
      where: {
        collegeId: id,
        ...(validCategory ? { category: validCategory } : {}),
      },
      include: {
        venue: { include: { building: { select: { name: true, lat: true, lng: true } } } },
      },
      orderBy: { startTime: 'asc' },
    })

    return ok({ events })
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const body = await request.json()
    const result = eventSchema.safeParse(body)
    if (!result.success) return err('Invalid event data', 400)

    const { venueId, startTime, endTime, ...rest } = result.data
    if (new Date(endTime) <= new Date(startTime)) return err('End time must be after start time', 400)

    const venue = await prisma.venue.findFirst({ where: { id: venueId, collegeId: id } })
    if (!venue) return err('Venue not found', 404)

    const event = await prisma.event.create({
      data: {
        ...rest,
        venueId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        collegeId: id,
      },
      include: { venue: true },
    })

    return ok(event, 201)
  } catch (e) {
    return serverErr(e)
  }
}
