import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { getModel, generateWithRetry } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

type EventWithConflicts = {
  id: string
  name: string
  category: string
  description: string | null
  venueName: string
  startTime: string
  endTime: string
  conflictsWith: string[]
}

type ScheduleToolInput = {
  selectedEventIds: string[]
  reasoning: string
}

const isScheduleToolInput = (value: unknown): value is ScheduleToolInput => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.selectedEventIds) &&
    v.selectedEventIds.every((id) => typeof id === 'string') &&
    typeof v.reasoning === 'string'
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`auto-schedule:${getClientIp(request)}`, 5, 3600000).success) {
      return err('Too many requests. Try again later.', 429)
    }

    const body = (await request.json()) as { interests?: unknown; collegeId?: unknown }
    const interests = typeof body.interests === 'string' ? body.interests : ''
    const collegeId = typeof body.collegeId === 'string' ? body.collegeId : ''

    if (!interests) return err('Please describe your interests', 400)
    if (!collegeId) return err('College ID required', 400)

    const allEvents = await prisma.event.findMany({
      where: { collegeId, status: { not: 'CANCELLED' } },
      include: { venue: true },
      orderBy: { startTime: 'asc' },
    })

    if (allEvents.length === 0) {
      return ok({ suggestedEvents: [], reasoning: 'No events available at this fest.' })
    }

    const eventsWithConflicts: EventWithConflicts[] = allEvents.map((event) => ({
      id: event.id,
      name: event.name,
      category: event.category,
      description: event.description,
      venueName: event.venue.name,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      conflictsWith: allEvents
        .filter(
          (other) =>
            other.id !== event.id &&
            event.startTime < other.endTime &&
            event.endTime > other.startTime,
        )
        .map((other) => other.id),
    }))

    const model = getModel('gemini-flash-lite-latest')

    const result = await generateWithRetry(model, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Visitor interests: "${interests}"

Available events (each lists which other events it conflicts with by ID):
${JSON.stringify(eventsWithConflicts, null, 2)}

Pick events that:
1. Best match the visitor's interests
2. Do NOT include two events that appear in each other's conflictsWith list
3. Leave reasonable time between events where possible

Respond ONLY with valid JSON in exactly this shape, no markdown, no extra text:
{
  "selectedEventIds": ["id1", "id2"],
  "reasoning": "one sentence explaining the picks"
}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
    })

    let parsed: unknown
    try {
      parsed = JSON.parse(result.response.text())
    } catch {
      return err('Could not generate schedule. Please try again.', 500)
    }

    if (!isScheduleToolInput(parsed)) {
      return err('Could not generate schedule. Please try again.', 500)
    }

    const { selectedEventIds, reasoning } = parsed
    const selected = eventsWithConflicts.filter((event) => selectedEventIds.includes(event.id))

    const validatedIds = new Set<string>()
    for (const event of selected) {
      const conflictsWithAlreadySelected = event.conflictsWith.some((id) => validatedIds.has(id))
      if (!conflictsWithAlreadySelected) validatedIds.add(event.id)
    }

    const finalEvents = allEvents
      .filter((event) => validatedIds.has(event.id))
      .map((event) => ({
        id: event.id,
        name: event.name,
        category: event.category,
        venueName: event.venue.name,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      }))

    return ok({ suggestedEvents: finalEvents, reasoning, isDraft: true })
  } catch (e) {
    return serverErr(e)
  }
}
