import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type CollegeRouteContext = { params: Promise<{ id: string }> }

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// "Today" must mean the admin's calendar day in India, not the host server's.
// Deriving it from the server's local timezone (e.g. via Date#setHours) breaks
// in production, where the server typically runs in UTC: for the ~5.5 hours
// after UTC midnight but before IST midnight, the UTC calendar date is still
// "yesterday", so the whole day's events would be excluded. Shifting into IST
// wall-clock time first, finding that day's boundaries, then shifting back
// keeps the window correct regardless of the server process's own timezone.
function getIstDayBoundsUtc(reference: Date) {
  const istNow = new Date(reference.getTime() + IST_OFFSET_MS)
  const istDayStartUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0)
  const istDayEndUtc = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999)

  return {
    dayStart: new Date(istDayStartUtc - IST_OFFSET_MS),
    dayEnd: new Date(istDayEndUtc - IST_OFFSET_MS),
  }
}

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const { dayStart, dayEnd } = getIstDayBoundsUtc(new Date())

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
