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

type LatLng = { lat: number; lng: number }
type PositionPercent = { xPercent: number; yPercent: number }

const MiniMap = dynamic(() => import('./mini-map').then((module) => module.MiniMap), { ssr: false })

const emptyBuildingForm = { id: '', name: '', shortName: '', floorPlanUrl: '', floors: '1' }
const emptyVenueForm = { name: '', buildingId: '', floor: '1', directions: '' }

export default function CollegeMapSetupPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'buildings' | 'venues'>('buildings')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [addingBuilding, setAddingBuilding] = useState(false)
  const [addingVenue, setAddingVenue] = useState(false)

  const [buildingForm, setBuildingForm] = useState(emptyBuildingForm)
  const [buildingLocation, setBuildingLocation] = useState<LatLng | null>(null)
  const [entrancePosition, setEntrancePosition] = useState<PositionPercent | null>(null)

  const [venueForm, setVenueForm] = useState(emptyVenueForm)
  const [venuePosition, setVenuePosition] = useState<PositionPercent | null>(null)

  const [distanceForm, setDistanceForm] = useState({ fromVenueId: '', toVenueId: '', walkMinutes: '5' })

  const mapPoints = useMemo(() => {
    return buildings
      .filter((building) => typeof building.lat === 'number' && typeof building.lng === 'number')
      .map((building) => ({ label: building.shortName ?? building.name, lat: building.lat as number, lng: building.lng as number }))
  }, [buildings])

  const selectedVenueBuilding = useMemo(
    () => buildings.find((building) => building.id === venueForm.buildingId) ?? null,
    [buildings, venueForm.buildingId],
  )

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

  const handleFloorPlanUpload = (file: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Floor plan image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setBuildingForm((prev) => ({ ...prev, floorPlanUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const resetBuildingForm = () => {
    setBuildingForm(emptyBuildingForm)
    setBuildingLocation(null)
    setEntrancePosition(null)
  }

  const createBuilding = async () => {
    if (!session?.user?.id) return
    if (!buildingLocation) {
      toast.error('Click on the map to mark the building location first')
      return
    }

    setAddingBuilding(true)

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildingForm.name,
          shortName: buildingForm.shortName || undefined,
          lat: buildingLocation.lat,
          lng: buildingLocation.lng,
          floorPlanUrl: buildingForm.floorPlanUrl || undefined,
          entranceXPercent: entrancePosition?.xPercent,
          entranceYPercent: entrancePosition?.yPercent,
          floors: Number(buildingForm.floors || '1'),
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not create building')

      toast.success('Building added')
      resetBuildingForm()
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
          lat: buildingLocation?.lat,
          lng: buildingLocation?.lng,
          floorPlanUrl: buildingForm.floorPlanUrl || undefined,
          entranceXPercent: entrancePosition?.xPercent,
          entranceYPercent: entrancePosition?.yPercent,
          floors: Number(buildingForm.floors || '1'),
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not update building')

      toast.success('Building updated')
      resetBuildingForm()
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
          xPercent: venuePosition?.xPercent,
          yPercent: venuePosition?.yPercent,
          directions: venueForm.directions.trim() || undefined,
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not add venue')

      setVenueForm(emptyVenueForm)
      setVenuePosition(null)
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
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                {buildingForm.id ? 'Editing building' : 'Add building'}
              </h2>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <input placeholder="Name" value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} />
                <input placeholder="Short name" value={buildingForm.shortName} onChange={(e) => setBuildingForm({ ...buildingForm, shortName: e.target.value })} />
                <input placeholder="Floors" value={buildingForm.floors} onChange={(e) => setBuildingForm({ ...buildingForm, floors: e.target.value })} />
              </div>

              <label style={{ display: 'block', marginTop: 14, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Floor plan image
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="btn-outline" style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      handleFloorPlanUpload(e.target.files?.[0] ?? null)
                      e.target.value = ''
                    }}
                  />
                  {buildingForm.floorPlanUrl ? 'Replace floor plan image' : 'Upload floor plan image'}
                </label>
                {buildingForm.floorPlanUrl && (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>✓ Uploaded</span>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => setBuildingForm((prev) => ({ ...prev, floorPlanUrl: '' }))}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>

              <p style={{ marginTop: 14, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Click on the map below to mark this building's location.
              </p>
              <MiniMap
                points={mapPoints}
                onMapClick={(lat, lng) => setBuildingLocation({ lat, lng })}
                pendingPoint={buildingLocation}
                pendingLabel={buildingForm.name || 'New building'}
              />
              {buildingLocation && (
                <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Location set: {buildingLocation.lat.toFixed(5)}, {buildingLocation.lng.toFixed(5)}
                </p>
              )}

              {buildingForm.floorPlanUrl && (
                <div style={{ marginTop: 14 }}>
                  <ClickableFloorPlan
                    src={buildingForm.floorPlanUrl}
                    pendingPercent={entrancePosition}
                    onPick={(xPercent, yPercent) => setEntrancePosition({ xPercent, yPercent })}
                    label="Click to mark the entrance point"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => void (buildingForm.id ? updateBuilding(buildingForm.id) : createBuilding())}
                  disabled={addingBuilding || !buildingForm.name.trim() || !buildingLocation}
                >
                  {addingBuilding ? (
                    <><span className="spinner" /> Saving...</>
                  ) : buildingForm.id ? (
                    'Save updates'
                  ) : (
                    'Add building'
                  )}
                </button>
                {buildingForm.id && (
                  <button className="btn-outline" onClick={resetBuildingForm}>
                    Cancel edit
                  </button>
                )}
              </div>
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
                          floorPlanUrl: building.floorPlanUrl ?? '',
                          floors: (building.floors ?? 1).toString(),
                        })
                        setBuildingLocation(
                          typeof building.lat === 'number' && typeof building.lng === 'number'
                            ? { lat: building.lat, lng: building.lng }
                            : null,
                        )
                        setEntrancePosition(
                          typeof building.entranceXPercent === 'number' && typeof building.entranceYPercent === 'number'
                            ? { xPercent: building.entranceXPercent, yPercent: building.entranceYPercent }
                            : null,
                        )
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
          </div>
        )}

        {tab === 'venues' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Add venue</h2>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <input placeholder="Venue name" value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} />
                <select
                  value={venueForm.buildingId}
                  onChange={(e) => {
                    setVenueForm({ ...venueForm, buildingId: e.target.value })
                    setVenuePosition(null)
                  }}
                >
                  <option value="">Select building</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
                <input placeholder="Floor" value={venueForm.floor} onChange={(e) => setVenueForm({ ...venueForm, floor: e.target.value })} />
              </div>

              <div style={{ marginTop: 14 }}>
                {selectedVenueBuilding?.floorPlanUrl ? (
                  <ClickableFloorPlan
                    src={selectedVenueBuilding.floorPlanUrl}
                    pendingPercent={venuePosition}
                    onPick={(xPercent, yPercent) => setVenuePosition({ xPercent, yPercent })}
                    label="Click on the floor plan to mark where this room is"
                  />
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Select a building with an uploaded floor plan first</p>
                )}
              </div>

              <input
                placeholder="Directions (optional) — e.g. Take the stairs to floor 2, room is on the left"
                value={venueForm.directions}
                onChange={(e) => setVenueForm({ ...venueForm, directions: e.target.value })}
                style={{ marginTop: 12 }}
              />

              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void addVenue()} disabled={addingVenue || !venueForm.name.trim()}>
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

function ClickableFloorPlan({
  src,
  pendingPercent,
  onPick,
  label,
}: {
  src: string
  pendingPercent: PositionPercent | null
  onPick: (xPercent: number, yPercent: number) => void
  label: string
}) {
  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100
    onPick(xPercent, yPercent)
  }

  return (
    <div>
      <p style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
      <div style={{ position: 'relative', width: '100%', cursor: 'crosshair', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <img src={src} alt="Floor plan" onClick={handleClick} style={{ width: '100%', display: 'block' }} />
        {pendingPercent && (
          <div
            style={{
              position: 'absolute',
              left: `${pendingPercent.xPercent}%`,
              top: `${pendingPercent.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--primary)',
              border: '2px solid #fff',
              boxShadow: '0 0 6px rgba(0,0,0,0.4)',
            }}
          />
        )}
      </div>
    </div>
  )
}
