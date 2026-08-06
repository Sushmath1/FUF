import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { anthropic } from '@/lib/anthropic'
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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `You are a helpful fest navigation assistant for FindUrFest.\nAnswer questions about the visitor's schedule concisely and helpfully.\nOnly answer based on the schedule data provided. If something is not in the schedule, say so honestly.\nKeep answers under 2 sentences. Be friendly and conversational.\nToday's date: ${new Date().toLocaleDateString('en-IN')}`,
      messages: [
        {
          role: 'user',
          content: `My schedule:\n${JSON.stringify(scheduleContext, null, 2)}\n\nQuestion: ${question}`,
        },
      ],
    })

    const first = response.content[0]
    const answer =
      first && first.type === 'text'
        ? first.text
        : 'Sorry, I could not answer that. Please check your schedule directly.'

    return ok({ answer })
  } catch (e) {
    return serverErr(e)
  }
}
