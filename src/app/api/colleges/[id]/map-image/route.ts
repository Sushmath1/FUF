import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapImageSchema } from '@/lib/validations'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const body = await request.json()
    const result = mapImageSchema.safeParse(body)
    if (!result.success) return err('Invalid input', 400)

    const college = await prisma.college.update({
      where: { id },
      data: { mapImageUrl: result.data.mapImageUrl },
      select: { id: true, mapImageUrl: true },
    })

    return ok(college)
  } catch (e) {
    return serverErr(e)
  }
}
