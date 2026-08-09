import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueSchema } from '@/lib/validations'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const venues = await prisma.venue.findMany({
      where: { collegeId: id },
      include: {
        building: { select: { id: true, name: true } },
        events: {
          where: {
            status: { in: ['SCHEDULED', 'CHANGED'] },
            endTime: { gt: new Date() },
          },
          select: { id: true, name: true, startTime: true, endTime: true },
          take: 1,
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ building: { name: 'asc' } }, { name: 'asc' }],
    })

    return ok({ venues })
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const body = await request.json()
    const result = venueSchema.safeParse(body)
    if (!result.success) return err('Invalid venue data', 400)

    const venue = await prisma.venue.create({ data: { ...result.data, collegeId: id } })
    return ok(venue, 201)
  } catch (e) {
    return serverErr(e)
  }
}
