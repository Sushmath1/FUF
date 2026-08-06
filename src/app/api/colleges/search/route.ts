import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    if (!rateLimit(`search:${ip}`, 30, 60000).success) return err('Too many requests', 429)

    const q = new URL(request.url).searchParams.get('q')?.trim()
    if (!q || q.length < 2) return ok({ colleges: [] })

    const colleges = await prisma.college.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { festName: { contains: q, mode: 'insensitive' } },
          { shortName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        festName: true,
        festTagline: true,
        logoUrl: true,
        bannerUrl: true,
        festStartDate: true,
        festEndDate: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        bgColor: true,
        moodText: true,
      },
      take: 10,
      orderBy: { festStartDate: 'desc' },
    })

    return ok({ colleges })
  } catch (e) {
    return serverErr(e)
  }
}
