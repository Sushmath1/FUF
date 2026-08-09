import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { anthropic } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

type Recommendation = { eventId: string; reason: string }

const isRecommendationList = (value: unknown): value is Recommendation[] => {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).eventId === 'string' &&
        typeof (item as Record<string, unknown>).reason === 'string',
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`recommend:${getClientIp(request)}`, 10, 3600000).success) {
      return err('Too many requests. Try again later.', 429)
    }

    const body = (await request.json()) as {
      collegeId?: unknown
      visitorId?: unknown
      guestSessionId?: unknown
    }
    const collegeId = typeof body.collegeId === 'string' ? body.collegeId : ''
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : undefined
    const guestSessionId = typeof body.guestSessionId === 'string' ? body.guestSessionId : undefined

    if (!collegeId) return err('College ID required', 400)
    if (!visitorId && !guestSessionId) return err('Session required', 400)

    const registered = await prisma.registration.findMany({
      where: { collegeId, ...(visitorId ? { visitorId } : { guestSessionId }) },
      include: { event: { include: { venue: true } } },
    })

    const registeredIds = registered.map((registration) => registration.eventId)
    const others = await prisma.event.findMany({
      where: { collegeId, id: { notIn: registeredIds }, status: { not: 'CANCELLED' } },
      include: { venue: true },
    })

    if (others.length === 0) return ok({ recommendations: [] })

    const sortedRegistered = registered
      .map((registration) => registration.event)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const fitsInGap = (event: (typeof others)[number]) => {
      if (sortedRegistered.length === 0) return true
      if (event.endTime <= sortedRegistered[0].startTime) return true
      if (event.startTime >= sortedRegistered[sortedRegistered.length - 1].endTime) return true

      for (let i = 0; i < sortedRegistered.length - 1; i++) {
        if (
          event.startTime >= sortedRegistered[i].endTime &&
          event.endTime <= sortedRegistered[i + 1].startTime
        ) {
          return true
        }
      }

      return false
    }

    const candidates = others.filter(fitsInGap)
    if (candidates.length === 0) return ok({ recommendations: [] })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      tools: [
        {
          name: 'rank_recommendations',
          description: 'Rank candidate events by relevance to visitor existing registrations',
          input_schema: {
            type: 'object',
            properties: {
              recommendations: {
                type: 'array',
                maxItems: 3,
                items: {
                  type: 'object',
                  properties: {
                    eventId: { type: 'string' },
                    reason: {
                      type: 'string',
                      description: 'Short reason - similar to X or fits between Y and Z',
                    },
                  },
                  required: ['eventId', 'reason'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'rank_recommendations' },
      messages: [
        {
          role: 'user',
          content: `Visitor is attending: ${registered.map((registration) => registration.event.name).join(', ') || 'no events yet'}\n\nEvents that fit in their free time slots:\n${JSON.stringify(candidates.map((candidate) => ({ id: candidate.id, name: candidate.name, category: candidate.category, venue: candidate.venue.name })))}\n\nPick top 3 most relevant. Give a short reason for each.`,
        },
      ],
    })

    const toolResult = response.content.find((block) => block.type === 'tool_use')
    if (!toolResult || toolResult.type !== 'tool_use') return ok({ recommendations: [] })

    const payload = toolResult.input as { recommendations?: unknown }
    if (!isRecommendationList(payload.recommendations)) return ok({ recommendations: [] })

    const enriched = payload.recommendations
      .map((recommendation) => {
        const event = candidates.find((candidate) => candidate.id === recommendation.eventId)
        if (!event) return null

        return {
          eventId: event.id,
          eventName: event.name,
          category: event.category,
          venueName: event.venue.name,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          reason: recommendation.reason,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return ok({ recommendations: enriched })
  } catch (e) {
    return serverErr(e)
  }
}
