import { NextRequest } from 'next/server'

import { ok, err, serverErr } from '@/lib/apiHelpers'
import { prisma } from '@/lib/prisma'

type CollegeRouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, context: CollegeRouteContext) {
  try {
    const { id } = await context.params

    const now = new Date()

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

    const buildingIds = college.buildings.map((b) => b.id)
    const liveEvents = buildingIds.length
      ? await prisma.event.findMany({
          where: {
            venue: { buildingId: { in: buildingIds } },
            status: { in: ['SCHEDULED', 'CHANGED'] },
            startTime: { lte: now },
            endTime: { gte: now },
          },
          select: { name: true, venue: { select: { buildingId: true } } },
          orderBy: { startTime: 'asc' },
        })
      : []

    const currentEventNameByBuildingId = new Map<string, string>()
    for (const event of liveEvents) {
      const buildingId = event.venue.buildingId
      if (buildingId && !currentEventNameByBuildingId.has(buildingId)) {
        currentEventNameByBuildingId.set(buildingId, event.name)
      }
    }

    const collegeWithLiveEvents = {
      ...college,
      buildings: college.buildings.map((building) => ({
        ...building,
        currentEventName: currentEventNameByBuildingId.get(building.id) ?? null,
      })),
    }

    return ok(collegeWithLiveEvents)
  } catch (e) {
    return serverErr(e)
  }
}
