import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildingSchema } from '@/lib/validations'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const buildings = await prisma.building.findMany({
      where: { collegeId: id },
      include: {
        floors: {
          select: {
            id: true,
            floorNumber: true,
            floorPlanUrl: true,
            entranceXPercent: true,
            entranceYPercent: true,
            venues: {
              select: {
                id: true,
                name: true,
                xPercent: true,
                yPercent: true,
                capacity: true,
              },
            },
          },
          orderBy: { floorNumber: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return ok({ buildings })
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
    const result = buildingSchema.safeParse(body)
    if (!result.success) return err('Invalid building data', 400)

    const building = await prisma.building.create({ data: { ...result.data, collegeId: id } })
    return ok(building, 201)
  } catch (e) {
    return serverErr(e)
  }
}
