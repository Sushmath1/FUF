import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type FloorRouteContext = { params: Promise<{ id: string; floorId: string }> }

export async function DELETE(_: NextRequest, context: FloorRouteContext) {
  try {
    const { id, floorId } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const floor = await prisma.floor.findFirst({ where: { id: floorId, building: { collegeId: id } } })
    if (!floor) return err('Floor not found', 404)

    const venueCount = await prisma.venue.count({ where: { floorId } })
    if (venueCount > 0) {
      return err(
        `Cannot delete — ${venueCount} venue${venueCount === 1 ? ' is' : 's are'} placed on this floor. Remove or reassign ${venueCount === 1 ? 'it' : 'them'} first.`,
        409,
      )
    }

    await prisma.floor.delete({ where: { id: floorId } })
    return ok({ success: true })
  } catch (e) {
    return serverErr(e)
  }
}
