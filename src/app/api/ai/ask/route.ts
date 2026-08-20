import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { getModel, generateWithRetry } from '@/lib/gemini'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`chatbot:${getClientIp(request)}`, 30, 3600000).success) {
      return err('Too many questions. Try again later.', 429)
    }

    const body = (await request.json()) as {
      question?: unknown
      visitorId?: string
      guestSessionId?: string
      collegeId?: string
    }
    const question = typeof body.question === 'string' ? body.question : ''
    const { visitorId, guestSessionId, collegeId } = body

    if (!question) return err('Question required', 400)
    if (question.length > 200) return err('Question too long', 400)
    if (!visitorId && !guestSessionId) return err('Session required', 400)
    if (!collegeId) return err('College ID required', 400)

    const registrations = await prisma.registration.findMany({
      where: visitorId ? { visitorId, collegeId } : { guestSessionId, collegeId },
      include: { event: { include: { venue: { include: { building: true } } } } },
      orderBy: { event: { startTime: 'asc' } },
    })

    const scheduleContext = registrations.map((registration) => ({
      event: registration.event.name,
      venue: registration.event.venue.name,
      building: registration.event.venue.building?.name ?? null,
      startTime: registration.event.startTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTime: registration.event.endTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: registration.event.status,
      contact: registration.event.contactName ?? null,
    }))

    const model = getModel('gemini-flash-lite-latest')

    const result = await generateWithRetry(model, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a helpful fest navigation assistant for FindUrFest.
Answer questions about the visitor's schedule concisely and helpfully.
Only answer based on the schedule data provided. If something is not in the schedule, say so honestly.
Keep answers under 2 sentences. Be friendly and conversational.
Today's date: ${new Date().toLocaleDateString('en-IN')}

My schedule:
${JSON.stringify(scheduleContext, null, 2)}

Question: ${question}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 150 },
    })

    const answer = result.response.text() || 'Sorry, I could not answer that. Please check your schedule directly.'

    return ok({ answer })
  } catch (e) {
    return serverErr(e)
  }
}
