import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type BuildingRouteContext = { params: Promise<{ id: string; buildingId: string }> }

export async function PATCH(request: NextRequest, context: BuildingRouteContext) {
  try {
    const { id, buildingId } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const existing = await prisma.building.findFirst({ where: { id: buildingId, collegeId: id } })
    if (!existing) return err('Building not found', 404)

    const body = await request.json()
    const building = await prisma.building.update({
      where: { id: buildingId },
      data: {
        name: body.name,
        shortName: body.shortName,
      },
    })

    return ok(building)
  } catch (e) {
    return serverErr(e)
  }
}

export async function DELETE(_: NextRequest, context: BuildingRouteContext) {
  try {
    const { id, buildingId } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const existing = await prisma.building.findFirst({ where: { id: buildingId, collegeId: id } })
    if (!existing) return err('Building not found', 404)

    const activeEvents = await prisma.event.count({
      where: {
        venue: { floor: { buildingId } },
        status: { in: ['SCHEDULED', 'CHANGED'] },
        endTime: { gt: new Date() },
      },
    })

    if (activeEvents > 0) {
      return err(`Cannot delete building with ${activeEvents} active events. Reassign events first.`, 400)
    }

    const floorCount = await prisma.floor.count({ where: { buildingId } })
    if (floorCount > 0) {
      return err(`Cannot delete building with ${floorCount} floor plan(s). Remove its floor plans first.`, 400)
    }

    await prisma.building.delete({ where: { id: buildingId } })
    return ok({ success: true })
  } catch (e) {
    return serverErr(e)
  }
}
