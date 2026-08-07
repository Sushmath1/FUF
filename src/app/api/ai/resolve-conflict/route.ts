import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { anthropic } from '@/lib/anthropic'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`resolve-conflict:${getClientIp(request)}`, 20, 3600000).success) {
      return err('Too many requests. Try again later.', 429)
    }

    const body = (await request.json()) as {
      currentEventName?: string
      conflictingEventName?: string
      currentStart?: string
      currentEnd?: string
      conflictingStart?: string
      conflictingEnd?: string
    }

    if (!body.currentEventName || !body.conflictingEventName) {
      return err('Event details required', 400)
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'You are a concise event planning assistant. Give one practical suggestion in one sentence for resolving schedule overlap.',
      messages: [
        {
          role: 'user',
          content: `Conflict: ${body.currentEventName} (${body.currentStart ?? ''}-${body.currentEnd ?? ''}) overlaps with ${body.conflictingEventName} (${body.conflictingStart ?? ''}-${body.conflictingEnd ?? ''}). Suggest a practical next step.`,
        },
      ],
    })

    const first = response.content[0]
    const suggestion = first && first.type === 'text' ? first.text : 'Consider attending the one most relevant to your goals and arrive early.'

    return ok({ suggestion })
  } catch (e) {
    return serverErr(e)
  }
}
