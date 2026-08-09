import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!rateLimit(`visitor-register:${ip}`, 5, 3600000).success) {
      return err('Too many attempts.', 429)
    }

    const { name, email, password } = await request.json()
    if (!email || !password) return err('Email and password required', 400)
    if (password.length < 8) return err('Password must be at least 8 characters', 400)

    const normalizedEmail = email.toLowerCase()
    const existing = await prisma.visitorAccount.findUnique({ where: { email: normalizedEmail } })
    if (existing) return err('An account with this email already exists', 409)

    const passwordHash = await bcrypt.hash(password, 12)
    const visitor = await prisma.visitor.create({
      data: {
        name,
        email: normalizedEmail,
        account: { create: { email: normalizedEmail, passwordHash } },
      },
    })

    return ok({ success: true, visitorId: visitor.id }, 201)
  } catch (error) {
    return serverErr(error)
  }
}