import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { floorSchema } from '@/lib/validations'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params
    const buildingId = new URL(request.url).searchParams.get('buildingId')

    const floors = await prisma.floor.findMany({
      where: {
        building: { collegeId: id },
        ...(buildingId ? { buildingId } : {}),
      },
      orderBy: [{ buildingId: 'asc' }, { floorNumber: 'asc' }],
    })

    return ok({ floors })
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
    const result = floorSchema.safeParse(body)
    if (!result.success) return err('Invalid floor data', 400)

    const building = await prisma.building.findFirst({ where: { id: result.data.buildingId, collegeId: id } })
    if (!building) return err('Building not found', 404)

    const floor = await prisma.floor.create({ data: result.data })
    return ok(floor, 201)
  } catch (e) {
    return serverErr(e)
  }
}
