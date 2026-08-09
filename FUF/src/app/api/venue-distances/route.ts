import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') return err('Unauthorized', 401)

    const body = (await request.json()) as {
      fromVenueId?: string
      toVenueId?: string
      walkMinutes?: unknown
    }
    const { fromVenueId, toVenueId, walkMinutes } = body

    if (!fromVenueId || !toVenueId || typeof walkMinutes !== 'number') {
      return err('Missing fields', 400)
    }
    if (walkMinutes < 1 || walkMinutes > 60) return err('walkMinutes must be 1-60', 400)

    const venues = await prisma.venue.findMany({
      where: { id: { in: [fromVenueId, toVenueId] }, collegeId: session.user.id },
    })
    if (venues.length !== 2) return err('Venues not found', 404)

    const existing = await prisma.venueDistance.findFirst({
      where: {
        OR: [
          { fromVenueId, toVenueId },
          { fromVenueId: toVenueId, toVenueId: fromVenueId },
        ],
      },
    })

    const result = existing
      ? await prisma.venueDistance.update({ where: { id: existing.id }, data: { walkMinutes } })
      : await prisma.venueDistance.create({ data: { fromVenueId, toVenueId, walkMinutes } })

    return ok(result)
  } catch (e) {
    return serverErr(e)
  }
}
