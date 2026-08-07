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

    if (!body.collegeId) return err('College ID required', 400)
    if (!Array.isArray(body.eventIds) || body.eventIds.length === 0) return err('Event IDs required', 400)
    if (!body.visitorId && !body.guestSessionId) return err('Session required', 400)

    const validEvents = await prisma.event.findMany({
      where: {
        id: { in: body.eventIds.filter((id): id is string => typeof id === 'string') },
        collegeId: body.collegeId,
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    })

    let added = 0
    for (const event of validEvents) {
      try {
        await prisma.registration.create({
          data: {
            collegeId: body.collegeId,
            eventId: event.id,
            ...(body.visitorId ? { visitorId: body.visitorId } : { guestSessionId: body.guestSessionId }),
          },
        })
        added++
      } catch {
        // Duplicate registrations are ignored.
      }
    }

    return ok({ added, total: validEvents.length })
  } catch (e) {
    return serverErr(e)
  }
}
