import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { collegeRegisterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    // TEMP: raised from 5 to 50/hour for local testing — revert to 5 before production deployment
    if (!rateLimit(`college-register:${ip}`, 50, 3600000).success) {
      return err('Too many attempts. Try again later.', 429)
    }

    const body = await request.json()
    const result = collegeRegisterSchema.safeParse(body)
    if (!result.success) return err('Invalid input', 400)

    const { adminEmail, password, ...rest } = result.data

    const existing = await prisma.collegeAccount.findUnique({ where: { adminEmail } })
    if (existing) return err('An account with this email already exists', 409)

    const passwordHash = await bcrypt.hash(password, 12)
    const college = await prisma.college.create({
      data: {
        ...rest,
        festStartDate: new Date(rest.festStartDate),
        festEndDate: new Date(rest.festEndDate),
        account: { create: { adminEmail, passwordHash } },
      },
    })

    return ok({ success: true, collegeId: college.id }, 201)
  } catch (error) {
    return serverErr(error)
  }
}