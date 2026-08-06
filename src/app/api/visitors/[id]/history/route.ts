import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type VisitorRouteContext = { params: Promise<{ id: string }> }

type HistoryGroup = {
  collegeId: string
  collegeName: string | null
  festName: string | null
  festDate: Date | null
  events: Array<{ name: string; venueName: string; startTime: Date }>
}

export async function GET(_: NextRequest, context: VisitorRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'visitor' || session.user.id !== id) {
      return err('Please log in to view your history', 401)
    }

    const registrations = await prisma.registration.findMany({
      where: { visitorId: id },
      include: { event: { include: { venue: true } } },
      orderBy: { event: { startTime: 'desc' } },
    })

    const grouped = new Map<string, HistoryGroup>()

    for (const reg of registrations) {
      if (!grouped.has(reg.collegeId)) {
        const college = await prisma.college.findUnique({
          where: { id: reg.collegeId },
          select: { name: true, festName: true, festStartDate: true },
        })

        grouped.set(reg.collegeId, {
          collegeId: reg.collegeId,
          collegeName: college?.name ?? null,
          festName: college?.festName ?? null,
          festDate: college?.festStartDate ?? null,
          events: [],
        })
      }

      grouped.get(reg.collegeId)?.events.push({
        name: reg.event.name,
        venueName: reg.event.venue.name,
        startTime: reg.event.startTime,
      })
    }

    return ok({ history: Array.from(grouped.values()) })
  } catch (e) {
    return serverErr(e)
  }
}
