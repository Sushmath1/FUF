'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'

type Building = {
  id: string
  name: string
  shortName?: string | null
  lat?: number | null
  lng?: number | null
  floorPlanUrl?: string | null
  entranceXPercent?: number | null
  entranceYPercent?: number | null
  floors?: number | null
}

type Venue = {
  id: string
  name: string
  buildingId?: string | null
  building?: { id: string; name: string } | null
  floor?: number | null
  xPercent?: number | null
  yPercent?: number | null
}

const MiniMap = dynamic(() => import('./mini-map').then((module) => module.MiniMap), { ssr: false })

export default function CollegeMapSetupPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'buildings' | 'venues'>('buildings')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [addingBuilding, setAddingBuilding] = useState(false)
  const [addingVenue, setAddingVenue] = useState(false)

  const [buildingForm, setBuildingForm] = useState({
    id: '',
    name: '',
    shortName: '',
    lat: '',
    lng: '',
    floorPlanUrl: '',
    floors: '1',
    entranceXPercent: '',
    entranceYPercent: '',
  })

  const [venueForm, setVenueForm] = useState({
    name: '',
    buildingId: '',
    floor: '1',
    xPercent: '',
    yPercent: '',
  })

  const [distanceForm, setDistanceForm] = useState({ fromVenueId: '', toVenueId: '', walkMinutes: '5' })

  const mapPoints = useMemo(() => {
    return buildings
      .filter((building) => typeof building.lat === 'number' && typeof building.lng === 'number')
      .map((building) => ({ label: building.shortName ?? building.name, lat: building.lat as number, lng: building.lng as number }))
  }, [buildings])

  const loadData = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const [buildingsRes, venuesRes] = await Promise.all([
        fetch(`/api/colleges/${session.user.id}/buildings`),
        fetch(`/api/colleges/${session.user.id}/venues`),
      ])

      const buildingsData = (await buildingsRes.json()) as { buildings?: Building[] }
      const venuesData = (await venuesRes.json()) as { venues?: Venue[] }

      setBuildings(buildingsData.buildings ?? [])
      setVenues(venuesData.venues ?? [])
    } catch {
      toast.error('Could not load map setup data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [session?.user?.id])

  const createBuilding = async () => {
    if (!session?.user?.id) return
    setAddingBuilding(true)

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildingForm.name,
          shortName: buildingForm.shortName || undefined,
          lat: buildingForm.lat ? Number(buildingForm.lat) : undefined,
          lng: buildingForm.lng ? Number(buildingForm.lng) : undefined,
          floors: Number(buildingForm.floors || '1'),
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not create building')

      toast.success('Building added')
      setBuildingForm({
        id: '',
        name: '',
        shortName: '',
        lat: '',
        lng: '',
        floorPlanUrl: '',
        floors: '1',
        entranceXPercent: '',
        entranceYPercent: '',
      })
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create building')
    } finally {
      setAddingBuilding(false)
    }
  }

  const updateBuilding = async (buildingId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/buildings/${buildingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildingForm.name,
          shortName: buildingForm.shortName || undefined,
          lat: buildingForm.lat ? Number(buildingForm.lat) : undefined,
          lng: buildingForm.lng ? Number(buildingForm.lng) : undefined,
          floorPlanUrl: buildingForm.floorPlanUrl || undefined,
          entranceXPercent: buildingForm.entranceXPercent ? Number(buildingForm.entranceXPercent) : undefined,
          entranceYPercent: buildingForm.entranceYPercent ? Number(buildingForm.entranceYPercent) : undefined,
          floors: Number(buildingForm.floors || '1'),
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not update building')

      toast.success('Building updated')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update building')
    }
  }

  const deleteBuilding = async (buildingId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/buildings/${buildingId}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not delete building')
      toast.success('Building deleted')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete building')
    }
  }

  const addVenue = async () => {
    if (!session?.user?.id) return
    setAddingVenue(true)

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/venues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: venueForm.name,
          buildingId: venueForm.buildingId || undefined,
          floor: Number(venueForm.floor || '1'),
          xPercent: venueForm.xPercent ? Number(venueForm.xPercent) : undefined,
          yPercent: venueForm.yPercent ? Number(venueForm.yPercent) : undefined,
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not add venue')

      setVenueForm({ name: '', buildingId: '', floor: '1', xPercent: '', yPercent: '' })
      toast.success('Venue added')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add venue')
    } finally {
      setAddingVenue(false)
    }
  }

  const saveDistance = async () => {
    if (!distanceForm.fromVenueId || !distanceForm.toVenueId) return

    try {
      const response = await fetch('/api/venue-distances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromVenueId: distanceForm.fromVenueId,
          toVenueId: distanceForm.toVenueId,
          walkMinutes: Number(distanceForm.walkMinutes),
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not save walk time')
      toast.success('Walk time saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save walk time')
    }
  }

  const groupedVenues = useMemo(() => {
    const grouped = new Map<string, Venue[]>()

    for (const venue of venues) {
      const key = venue.building?.name ?? 'No building'
      const list = grouped.get(key) ?? []
      list.push(venue)
      grouped.set(key, list)
    }

    return Array.from(grouped.entries())
  }, [venues])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner" style={{ color: 'var(--primary)' }} />
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingBottom: 40 }}>
      <Navbar role="college" />

      <section style={{ width: 'min(1100px, 100%)', margin: '0 auto', padding: '90px 20px 20px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button className={tab === 'buildings' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('buildings')}>
            Buildings
          </button>
          <button className={tab === 'venues' ? 'btn-primary' : 'btn-outline'} onClick={() => setTab('venues')}>
            Venues
          </button>
        </div>

        {tab === 'buildings' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Add building</h2>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <input placeholder="Name" value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} />
                <input placeholder="Short name" value={buildingForm.shortName} onChange={(e) => setBuildingForm({ ...buildingForm, shortName: e.target.value })} />
                <input placeholder="Latitude" value={buildingForm.lat} onChange={(e) => setBuildingForm({ ...buildingForm, lat: e.target.value })} />
                <input placeholder="Longitude" value={buildingForm.lng} onChange={(e) => setBuildingForm({ ...buildingForm, lng: e.target.value })} />
                <input placeholder="Floors" value={buildingForm.floors} onChange={(e) => setBuildingForm({ ...buildingForm, floors: e.target.value })} />
                <input placeholder="Floor plan URL" value={buildingForm.floorPlanUrl} onChange={(e) => setBuildingForm({ ...buildingForm, floorPlanUrl: e.target.value })} />
                <input placeholder="Entrance X %" value={buildingForm.entranceXPercent} onChange={(e) => setBuildingForm({ ...buildingForm, entranceXPercent: e.target.value })} />
                <input placeholder="Entrance Y %" value={buildingForm.entranceYPercent} onChange={(e) => setBuildingForm({ ...buildingForm, entranceYPercent: e.target.value })} />
              </div>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void createBuilding()} disabled={addingBuilding}>
                {addingBuilding ? <><span className="spinner" /> Saving...</> : 'Add building'}
              </button>
            </div>

            {buildings.map((building) => (
              <article key={building.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{building.name}</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                      Floors: {building.floors ?? 1} | GPS: {building.lat && building.lng ? 'Set' : 'Missing'} | Floor plan:{' '}
                      {building.floorPlanUrl ? 'Available' : 'Missing'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setBuildingForm({
                          id: building.id,
                          name: building.name,
                          shortName: building.shortName ?? '',
                          lat: building.lat?.toString() ?? '',
                          lng: building.lng?.toString() ?? '',
                          floorPlanUrl: building.floorPlanUrl ?? '',
                          floors: (building.floors ?? 1).toString(),
                          entranceXPercent: building.entranceXPercent?.toString() ?? '',
                          entranceYPercent: building.entranceYPercent?.toString() ?? '',
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-outline" onClick={() => void deleteBuilding(building.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {buildingForm.id && (
              <div className="card" style={{ padding: 14 }}>
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Editing building</h3>
                <button className="btn-primary" onClick={() => void updateBuilding(buildingForm.id)}>
                  Save updates
                </button>
              </div>
            )}

            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Mini map</h3>
              <MiniMap points={mapPoints} />
            </div>
          </div>
        )}

        {tab === 'venues' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Add venue</h2>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <input placeholder="Venue name" value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} />
                <select value={venueForm.buildingId} onChange={(e) => setVenueForm({ ...venueForm, buildingId: e.target.value })}>
                  <option value="">Select building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
                <input placeholder="Floor" value={venueForm.floor} onChange={(e) => setVenueForm({ ...venueForm, floor: e.target.value })} />
                <input placeholder="X % on floor plan" value={venueForm.xPercent} onChange={(e) => setVenueForm({ ...venueForm, xPercent: e.target.value })} />
                <input placeholder="Y % on floor plan" value={venueForm.yPercent} onChange={(e) => setVenueForm({ ...venueForm, yPercent: e.target.value })} />
              </div>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void addVenue()} disabled={addingVenue}>
                {addingVenue ? <><span className="spinner" /> Saving...</> : 'Add venue'}
              </button>
            </div>

            {groupedVenues.map(([groupName, list]) => (
              <div key={groupName} className="card" style={{ padding: 14 }}>
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{groupName}</h3>
                {list.map((venue) => (
                  <div key={venue.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                    <p style={{ fontWeight: 700 }}>{venue.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      Floor {venue.floor ?? 1} | Position: {venue.xPercent != null && venue.yPercent != null ? 'Set' : 'Missing'}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Walk-time entry</h3>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <select value={distanceForm.fromVenueId} onChange={(e) => setDistanceForm({ ...distanceForm, fromVenueId: e.target.value })}>
                  <option value="">From venue</option>
                  {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
                </select>
                <select value={distanceForm.toVenueId} onChange={(e) => setDistanceForm({ ...distanceForm, toVenueId: e.target.value })}>
                  <option value="">To venue</option>
                  {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
                </select>
                <input value={distanceForm.walkMinutes} onChange={(e) => setDistanceForm({ ...distanceForm, walkMinutes: e.target.value })} placeholder="Walk minutes" />
              </div>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void saveDistance()}>
                Save walk time
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
