import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { getModel, generateWithRetry } from '@/lib/gemini'
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

    const model = getModel('gemini-flash-lite-latest')

    const result = await generateWithRetry(model, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a concise event planning assistant. Give one practical suggestion in one sentence for resolving schedule overlap.

Conflict: ${body.currentEventName} (${body.currentStart ?? ''}-${body.currentEnd ?? ''}) overlaps with ${body.conflictingEventName} (${body.conflictingStart ?? ''}-${body.conflictingEnd ?? ''}). Suggest a practical next step.`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 60 },
    })

    const suggestion = result.response.text() || 'Consider attending the one most relevant to your goals and arrive early.'

    return ok({ suggestion })
  } catch (e) {
    return serverErr(e)
  }
}
