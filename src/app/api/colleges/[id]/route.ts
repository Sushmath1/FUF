import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const college = await prisma.college.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        shortName: true,
        festName: true,
        festTagline: true,
        logoUrl: true,
        bannerUrl: true,
        mapImageUrl: true,
        mainGateLat: true,
        mainGateLng: true,
        contactName: true,
        contactNumber: true,
        festStartDate: true,
        festEndDate: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        bgColor: true,
        surfaceColor: true,
        fontStyle: true,
        moodText: true,
        particleStyle: true,
        themeDescription: true,
        buildings: {
          select: {
            id: true,
            name: true,
            shortName: true,
            lat: true,
            lng: true,
            floorPlanUrl: true,
            entranceXPercent: true,
            entranceYPercent: true,
            floors: true,
            venues: {
              select: {
                id: true,
                name: true,
                floor: true,
                xPercent: true,
                yPercent: true,
                lat: true,
                lng: true,
                capacity: true,
              },
            },
          },
        },
        venues: {
          where: { buildingId: null },
          select: { id: true, name: true, lat: true, lng: true, capacity: true },
        },
      },
    })

    if (!college) return err('College not found', 404)
    return ok(college)
  } catch (e) {
    return serverErr(e)
  }
}
