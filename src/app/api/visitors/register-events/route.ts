import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      collegeId?: string
      eventIds?: unknown
      visitorId?: string
      guestSessionId?: string
    }

    const { collegeId, visitorId, guestSessionId } = body
    if (!collegeId) return err('College ID required', 400)
    if (!Array.isArray(body.eventIds) || body.eventIds.length === 0) return err('Event IDs required', 400)
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const validEvents = await prisma.event.findMany({
      where: {
        id: { in: body.eventIds.filter((id): id is string => typeof id === 'string') },
        collegeId,
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    })

    const result = await prisma.registration.createMany({
      data: validEvents.map((event) => ({
        collegeId,
        eventId: event.id,
        ...(visitorId ? { visitorId } : { guestSessionId }),
      })),
      skipDuplicates: true,
    })

    return ok({ added: result.count, total: validEvents.length })
  } catch (e) {
    return serverErr(e)
  }
}
