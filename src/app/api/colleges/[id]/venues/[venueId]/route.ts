import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type VenueRouteContext = { params: Promise<{ id: string; venueId: string }> }

export async function DELETE(_: NextRequest, context: VenueRouteContext) {
  try {
    const { id, venueId } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const venue = await prisma.venue.findFirst({ where: { id: venueId, collegeId: id } })
    if (!venue) return err('Venue not found', 404)

    const events = await prisma.event.findMany({ where: { venueId }, select: { name: true }, take: 50 })
    if (events.length > 0) {
      const names = events.map((event) => `"${event.name}"`).join(', ')
      return err(
        `Cannot delete — ${events.length} event(s) are assigned to this venue (${names}). Reassign or cancel them first.`,
        409,
      )
    }

    await prisma.$transaction([
      prisma.venueDistance.deleteMany({ where: { OR: [{ fromVenueId: venueId }, { toVenueId: venueId }] } }),
      prisma.venue.delete({ where: { id: venueId } }),
    ])

    return ok({ success: true })
  } catch (e) {
    return serverErr(e)
  }
}
