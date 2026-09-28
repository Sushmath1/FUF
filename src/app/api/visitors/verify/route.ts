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

    // A visitorId can outlive the Visitor row it points to (e.g. the account was
    // removed after the browser already had a signed-in session) — the FK on
    // Registration.visitorId would then reject every insert.
    if (visitorId) {
      const visitorExists = await prisma.visitor.findUnique({ where: { id: visitorId }, select: { id: true } })
      if (!visitorExists) return err('Your session is no longer valid. Please sign in again.', 401)
    }

    // Same normalization as the CSV upload route: lowercase+trim email, strip to
    // the last 10 digits of phone — so a row saved by one and looked up by the
    // other always agree on what the "same" email/phone means.
    const normalizedEmail = email?.toLowerCase().trim()
    const normalizedPhone = phone?.replace(/\D/g, '').slice(-10)

    const orConds: Array<{ email: string } | { phone: string }> = []
    if (normalizedEmail) orConds.push({ email: normalizedEmail })
    if (normalizedPhone) orConds.push({ phone: normalizedPhone })

    // No `matched: false` filter — matched is purely informational now. Gating the
    // lookup on it meant a visitor could only ever successfully verify once: the
    // first call flipped their entries to matched:true, and every retry, refresh,
    // or second device came back "no registrations found" even though they really
    // were registered. Verifying must work an unlimited number of times.
    const entries = await prisma.preRegisteredEntry.findMany({
      where: { collegeId, OR: orConds },
    })

    if (entries.length === 0) {
      return ok({
        found: 0,
        events: [],
        message: 'No registered events found. Try your other email or phone number.',
      })
    }

    const uniqueEventIds = [...new Set(entries.map((entry) => entry.eventId))]

    // createMany + skipDuplicates makes this idempotent: creating a registration
    // that already exists for this exact visitor/guest + event is silently skipped
    // rather than throwing, so re-verifying never fails because "you're already
    // registered" — that's a success, not an error.
    await prisma.registration.createMany({
      data: uniqueEventIds.map((eventId) => ({
        eventId,
        collegeId,
        ...(visitorId ? { visitorId } : { guestSessionId }),
      })),
      skipDuplicates: true,
    })

    await prisma.preRegisteredEntry.updateMany({
      where: { id: { in: entries.map((entry) => entry.id) } },
      data: { matched: true },
    })

    // Always return the full set of the person's events — whether this call just
    // created the registrations or they already existed from an earlier verify.
    const events = await prisma.event.findMany({
      where: { id: { in: uniqueEventIds } },
      include: { venue: { include: { floor: { include: { building: true } } } } },
    })
    const eventById = new Map(events.map((event) => [event.id, event]))

    const registeredEvents = uniqueEventIds
      .map((eventId) => eventById.get(eventId))
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .map((event) => ({
        id: event.id,
        name: event.name,
        category: event.category,
        venueName: event.venue.name,
        buildingName: event.venue.floor?.building?.name ?? null,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        contactName: event.contactName,
        contactNumber: event.contactNumber,
      }))

    return ok({ found: registeredEvents.length, events: registeredEvents })
  } catch (e) {
    return serverErr(e)
  }
}
