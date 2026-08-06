import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { verifySchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`verify:${getClientIp(request)}`, 10, 300000).success) {
      return err('Too many attempts. Try again in 5 minutes.', 429)
    }

    const body = (await request.json()) as {
      collegeId?: string
      email?: string
      phone?: string
      visitorId?: string
      guestSessionId?: string
    }

    const result = verifySchema.safeParse(body)
    if (!result.success) return err('Please provide your email or phone number', 400)

    const { collegeId, email, phone } = result.data
    const { visitorId, guestSessionId } = body
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const normalizedEmail = email?.toLowerCase().trim()
    const normalizedPhone = phone?.replace(/\D/g, '').slice(-10)

    const orConds: Array<{ email: string } | { phone: string }> = []
    if (normalizedEmail) orConds.push({ email: normalizedEmail })
    if (normalizedPhone) orConds.push({ phone: normalizedPhone })

    const entries = await prisma.preRegisteredEntry.findMany({
      where: { collegeId, matched: false, OR: orConds },
    })

    if (entries.length === 0) {
      return ok({
        found: 0,
        events: [],
        message: 'No registered events found. Try your other email or phone number.',
      })
    }

    const registeredEvents: Array<{
      id: string
      name: string
      category: string
      venueName: string
      buildingName: string | null
      startTime: string
      endTime: string
      contactName: string | null
      contactNumber: string | null
    }> = []

    for (const entry of entries) {
      try {
        await prisma.registration.create({
          data: {
            eventId: entry.eventId,
            collegeId,
            ...(visitorId ? { visitorId } : { guestSessionId }),
          },
        })

        await prisma.preRegisteredEntry.update({ where: { id: entry.id }, data: { matched: true } })

        const event = await prisma.event.findUnique({
          where: { id: entry.eventId },
          include: { venue: { include: { building: true } } },
        })

        if (event) {
          registeredEvents.push({
            id: event.id,
            name: event.name,
            category: event.category,
            venueName: event.venue.name,
            buildingName: event.venue.building?.name ?? null,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            contactName: event.contactName,
            contactNumber: event.contactNumber,
          })
        }
      } catch {
        // Ignore duplicate registration attempts.
      }
    }

    return ok({ found: registeredEvents.length, events: registeredEvents })
  } catch (e) {
    return serverErr(e)
  }
}
