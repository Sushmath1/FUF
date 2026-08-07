import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(now)
    dayEnd.setHours(23, 59, 59, 999)

    const [eventsToday, totalRegistrations] = await Promise.all([
      prisma.event.count({
        where: {
          collegeId: id,
          startTime: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.registration.count({ where: { collegeId: id } }),
    ])

    return ok({ eventsToday, totalRegistrations })
  } catch (e) {
    return serverErr(e)
  }
}
