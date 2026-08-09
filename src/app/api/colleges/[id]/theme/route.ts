import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const session = await auth()
    if (!session || session.user.role !== 'college' || session.user.id !== id) {
      return err('Unauthorized', 401)
    }

    const body = await request.json()
    const college = await prisma.college.update({
      where: { id },
      data: {
        themeDescription: body.themeDescription,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        bgColor: body.bgColor,
        surfaceColor: body.surfaceColor,
        fontStyle: body.fontStyle,
        moodText: body.moodText,
        particleStyle: body.particleStyle,
      },
    })

    return ok(college)
  } catch (e) {
    return serverErr(e)
  }
}
