import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

type CollegeRouteContext = { params: Promise<{ id: string }> }

type UploadEntry = {
  eventName?: unknown
  email?: unknown
  phone?: unknown
}

export async function POST(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    if (!rateLimit(`csv:${id}`, 10, 3600000).success) {
      return err('Too many uploads. Try again later.', 429)
    }

    const body = (await request.json()) as { entries?: unknown }
    if (!Array.isArray(body.entries)) return err('Invalid format', 400)
    if (body.entries.length > 5000) return err('Maximum 5000 entries per upload', 400)

    const events = await prisma.event.findMany({ where: { collegeId: id }, select: { id: true, name: true } })
    const eventMap = new Map(events.map((event) => [event.name.toLowerCase().trim(), event.id]))

    const toCreate: Array<{
      collegeId: string
      eventId: string
      eventName: string
      email: string | null
      phone: string | null
    }> = []
    const unmatched: string[] = []

    for (const rawEntry of body.entries) {
      const entry = (rawEntry ?? {}) as UploadEntry
      const rawEventName = String(entry.eventName ?? '').trim()
      const eventId = eventMap.get(rawEventName.toLowerCase())

      if (!eventId) {
        if (rawEventName && !unmatched.includes(rawEventName)) unmatched.push(rawEventName)
        continue
      }

      const email = entry.email ? String(entry.email).toLowerCase().trim() : null
      const phone = entry.phone ? String(entry.phone).replace(/\D/g, '').slice(-10) : null
      if (!email && !phone) continue

      toCreate.push({
        collegeId: id,
        eventId,
        eventName: rawEventName,
        email,
        phone,
      })
    }

    let matched = 0
    for (let i = 0; i < toCreate.length; i += 500) {
      const result = await prisma.preRegisteredEntry.createMany({
        data: toCreate.slice(i, i + 500),
        skipDuplicates: true,
      })
      matched += result.count
    }

    return ok({ matched, unmatched, total: body.entries.length })
  } catch (e) {
    return serverErr(e)
  }
}
