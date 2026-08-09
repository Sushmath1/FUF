import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { anthropic } from '@/lib/anthropic'
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      tools: [
        {
          name: 'select_events',
          description: 'Select a non-conflicting set of events matching visitor interests',
          input_schema: {
            type: 'object',
            properties: {
              selectedEventIds: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Event IDs to include - must not pick two events that conflict with each other',
              },
              reasoning: { type: 'string', description: 'One sentence explaining the picks' },
            },
            required: ['selectedEventIds', 'reasoning'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'select_events' },
      messages: [
        {
          role: 'user',
          content: `Visitor interests: "${interests}"\n\nAvailable events (each lists which other events it conflicts with by ID):\n${JSON.stringify(eventsWithConflicts, null, 2)}\n\nPick events that:\n1. Best match the visitor's interests\n2. Do NOT include two events that appear in each other's conflictsWith list\n3. Leave reasonable time between events where possible`,
        },
      ],
    })

    const toolResult = response.content.find((block) => block.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use' || !isScheduleToolInput(toolResult.input)) {
      return err('Could not generate schedule. Please try again.', 500)
    }

    const { selectedEventIds, reasoning } = toolResult.input
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
