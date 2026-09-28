'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'
import { floorLabel } from '@/lib/floorLabel'

type Floor = {
  id: string
  floorNumber: number
  floorPlanUrl: string
  entranceXPercent?: number | null
  entranceYPercent?: number | null
  venues?: Array<{ id: string; name: string }>
}

type Building = {
  id: string
  name: string
  shortName?: string | null
  floors: Floor[]
}

type Venue = {
  id: string
  name: string
  floorId?: string | null
  floor?: {
    id: string
    floorNumber: number
    building?: { id: string; name: string; shortName?: string | null } | null
  } | null
  xPercent?: number | null
  yPercent?: number | null
}

type PositionPercent = { xPercent: number; yPercent: number }

const emptyBuildingForm = { id: '', name: '', shortName: '' }
const emptyFloorForm = { buildingId: '', floorNumber: '0' }
const emptyVenueForm = { name: '', buildingId: '', floorId: '', directions: '' }

export default function CollegeMapSetupPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'buildings' | 'venues'>('buildings')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [addingBuilding, setAddingBuilding] = useState(false)
  const [addingFloor, setAddingFloor] = useState(false)
  const [addingVenue, setAddingVenue] = useState(false)
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null)
  const [uploadingMapImage, setUploadingMapImage] = useState(false)

  const [buildingForm, setBuildingForm] = useState(emptyBuildingForm)

  const [floorForm, setFloorForm] = useState(emptyFloorForm)
  const [floorPlanUrl, setFloorPlanUrl] = useState('')
  const [floorEntrancePosition, setFloorEntrancePosition] = useState<PositionPercent | null>(null)

  const [venueForm, setVenueForm] = useState(emptyVenueForm)
  const [venuePosition, setVenuePosition] = useState<PositionPercent | null>(null)

  const [distanceForm, setDistanceForm] = useState({ fromVenueId: '', toVenueId: '', walkMinutes: '5' })

  const floorFormBuilding = useMemo(
    () => buildings.find((building) => building.id === floorForm.buildingId) ?? null,
    [buildings, floorForm.buildingId],
  )

  const selectedVenueBuilding = useMemo(
    () => buildings.find((building) => building.id === venueForm.buildingId) ?? null,
    [buildings, venueForm.buildingId],
  )

  const selectedVenueFloor = useMemo(
    () => selectedVenueBuilding?.floors.find((floor) => floor.id === venueForm.floorId) ?? null,
    [selectedVenueBuilding, venueForm.floorId],
  )

  const loadData = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const [buildingsRes, venuesRes, collegeRes] = await Promise.all([
        fetch(`/api/colleges/${session.user.id}/buildings`),
        fetch(`/api/colleges/${session.user.id}/venues`),
        fetch(`/api/colleges/${session.user.id}`),
      ])

      const buildingsData = (await buildingsRes.json()) as { buildings?: Building[] }
      const venuesData = (await venuesRes.json()) as { venues?: Venue[] }
      const collegeData = (await collegeRes.json()) as { mapImageUrl?: string | null }

      setBuildings(buildingsData.buildings ?? [])
      setVenues(venuesData.venues ?? [])
      setMapImageUrl(collegeData.mapImageUrl ?? null)
    } catch {
      toast.error('Could not load map setup data')
    } finally {
      setLoading(false)
    }
  }

  const handleMapImageUpload = (file: File | null) => {
    if (!file || !session?.user?.id) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Campus image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setUploadingMapImage(true)
      try {
        const response = await fetch(`/api/colleges/${session.user.id}/map-image`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mapImageUrl: dataUrl }),
        })
        const data = (await response.json()) as { error?: string; mapImageUrl?: string | null }
        if (!response.ok) throw new Error(data.error ?? 'Could not save campus image')
        setMapImageUrl(data.mapImageUrl ?? dataUrl)
        toast.success('Campus image saved')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save campus image')
      } finally {
        setUploadingMapImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    void loadData()
  }, [session?.user?.id])

  const resetBuildingForm = () => {
    setBuildingForm(emptyBuildingForm)
  }

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

  const handleFloorPlanUpload = (file: File | null) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Floor plan image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setFloorPlanUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const resetFloorForm = () => {
    setFloorForm(emptyFloorForm)
    setFloorPlanUrl('')
    setFloorEntrancePosition(null)
  }

  const addFloorPlan = async () => {
    if (!session?.user?.id) return
    if (!floorForm.buildingId) {
      toast.error('Select a building first')
      return
    }
    if (!floorPlanUrl) {
      toast.error('Upload a floor plan image first')
      return
    }

    const floorNumber = Number(floorForm.floorNumber)
    if (floorForm.floorNumber.trim() === '' || !Number.isInteger(floorNumber) || floorNumber < 0) {
      toast.error('Floor number must be 0 or higher (0 = ground floor)')
      return
    }

    setAddingFloor(true)

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/floors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: floorForm.buildingId,
          floorNumber,
          floorPlanUrl,
          entranceXPercent: floorEntrancePosition?.xPercent,
          entranceYPercent: floorEntrancePosition?.yPercent,
        }),
      })

      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not add floor plan')

      toast.success('Floor plan added')
      resetFloorForm()
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add floor plan')
    } finally {
      setAddingFloor(false)
    }
  }

  const deleteFloor = async (floorId: string) => {
    if (!session?.user?.id) return
    if (!window.confirm('Delete this floor plan? Any venues placed on it will also need to be reassigned.')) return

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/floors/${floorId}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not delete floor plan')

      setBuildings((prev) =>
        prev.map((building) => ({ ...building, floors: building.floors.filter((floor) => floor.id !== floorId) })),
      )
      if (venueForm.floorId === floorId) {
        setVenueForm((prev) => ({ ...prev, floorId: '' }))
        setVenuePosition(null)
      }
      toast.success('Floor plan deleted')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete floor plan')
    }
  }

  const deleteVenue = async (venueId: string) => {
    if (!session?.user?.id) return
    if (!window.confirm('Delete this venue? This cannot be undone. Any events currently assigned to this venue will need to be reassigned.')) return

    try {
      const response = await fetch(`/api/colleges/${session.user.id}/venues/${venueId}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not delete venue')

      setVenues((prev) => prev.filter((venue) => venue.id !== venueId))
      setDistanceForm((prev) => ({
        ...prev,
        fromVenueId: prev.fromVenueId === venueId ? '' : prev.fromVenueId,
        toVenueId: prev.toVenueId === venueId ? '' : prev.toVenueId,
      }))
      toast.success('Venue deleted')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete venue')
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
          floorId: venueForm.floorId || undefined,
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

  const venueLocationLabel = (venue: Venue) => {
    const buildingName = venue.floor?.building?.shortName ?? venue.floor?.building?.name
    if (!buildingName || !venue.floor) return 'No building assigned'
    return `${buildingName}, ${floorLabel(venue.floor.floorNumber)}`
  }

  const groupedVenues = useMemo(() => {
    const grouped = new Map<string, Venue[]>()

    for (const venue of venues) {
      const key = venue.floor?.building?.name ?? 'No building'
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
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Campus overview image</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            A satellite screenshot or photo of your full campus layout. Visitors see this in the Campus guide, with
            building pins placed on top of it.
          </p>

          {mapImageUrl && (
            <img
              src={mapImageUrl}
              alt="Campus overview"
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 10, marginBottom: 12, border: '1px solid var(--border)' }}
            />
          )}

          <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-block', textAlign: 'center' }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              style={{ display: 'none' }}
              disabled={uploadingMapImage}
              onChange={(e) => {
                handleMapImageUpload(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            {uploadingMapImage ? (
              <><span className="spinner" /> Saving...</>
            ) : mapImageUrl ? (
              'Replace campus image'
            ) : (
              'Upload campus image'
            )}
          </label>
        </div>

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
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Building name
                  </label>
                  <input
                    placeholder="e.g. Main Block"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Short name (optional)
                  </label>
                  <input
                    placeholder="e.g. CSE"
                    value={buildingForm.shortName}
                    onChange={(e) => setBuildingForm({ ...buildingForm, shortName: e.target.value })}
                  />
                  <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    A short label shown on maps, e.g. CSE
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => void (buildingForm.id ? updateBuilding(buildingForm.id) : createBuilding())}
                  disabled={addingBuilding || !buildingForm.name.trim()}
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
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                      {building.name}
                      {building.shortName ? ` (${building.shortName})` : ''}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                      {building.name} — {building.floors.length} floor{building.floors.length === 1 ? '' : 's'} added
                    </p>
                    {building.floors.length > 0 && (
                      <ul style={{ listStyle: 'none', marginTop: 10, display: 'grid', gap: 6 }}>
                        {building.floors
                          .slice()
                          .sort((a, b) => a.floorNumber - b.floorNumber)
                          .map((floor) => (
                            <li
                              key={floor.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}
                            >
                              <img
                                src={floor.floorPlanUrl}
                                alt={`${floorLabel(floor.floorNumber)} plan`}
                                style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                              />
                              <span style={{ fontWeight: 700 }}>{floorLabel(floor.floorNumber)}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                {(floor.venues?.length ?? 0)} venue{floor.venues?.length === 1 ? '' : 's'}
                              </span>
                              <button
                                type="button"
                                className="btn-outline"
                                aria-label={`Delete ${floorLabel(floor.floorNumber)} floor plan`}
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => void deleteFloor(floor.id)}
                              >
                                Delete
                              </button>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setBuildingForm({
                          id: building.id,
                          name: building.name,
                          shortName: building.shortName ?? '',
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

            <div className="card" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Add floor plan</h2>

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Select building
                  </label>
                  <select
                    value={floorForm.buildingId}
                    onChange={(e) => setFloorForm({ ...floorForm, buildingId: e.target.value })}
                  >
                    <option value="">Select building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Which floor is this? (e.g. 0 for ground floor, 1 for first floor, 2 for second floor)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={floorForm.floorNumber}
                    onChange={(e) => setFloorForm({ ...floorForm, floorNumber: e.target.value })}
                  />
                </div>
              </div>

              <label style={{ display: 'block', marginTop: 14, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Upload floor plan image
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
                  {floorPlanUrl ? 'Replace floor plan image' : 'Upload floor plan image'}
                </label>
                {floorPlanUrl && (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>✓ Uploaded</span>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => {
                        setFloorPlanUrl('')
                        setFloorEntrancePosition(null)
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>

              {floorPlanUrl && (
                <div style={{ marginTop: 14 }}>
                  <ClickableFloorPlan
                    src={floorPlanUrl}
                    pendingPercent={floorEntrancePosition}
                    onPick={(xPercent, yPercent) => setFloorEntrancePosition({ xPercent, yPercent })}
                    label="Optional: click to mark the entrance point"
                  />
                </div>
              )}

              <button
                className="btn-primary"
                style={{ marginTop: 14 }}
                onClick={() => void addFloorPlan()}
                disabled={addingFloor || !floorForm.buildingId || !floorPlanUrl}
              >
                {addingFloor ? <><span className="spinner" /> Saving...</> : 'Add floor plan'}
              </button>

              {floorFormBuilding && floorFormBuilding.floors.length > 0 && (
                <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  {floorFormBuilding.name} already has: {floorFormBuilding.floors.map((floor) => floor.floorNumber).sort((a, b) => a - b).map(floorLabel).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'venues' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Add venue</h2>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Venue name
                  </label>
                  <input
                    placeholder="e.g. Lab 2"
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Select building
                  </label>
                  <select
                    value={venueForm.buildingId}
                    onChange={(e) => {
                      setVenueForm({ ...venueForm, buildingId: e.target.value, floorId: '' })
                      setVenuePosition(null)
                    }}
                  >
                    <option value="">Select building</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Select floor
                  </label>
                  <select
                    value={venueForm.floorId}
                    disabled={!selectedVenueBuilding || selectedVenueBuilding.floors.length === 0}
                    onChange={(e) => {
                      setVenueForm({ ...venueForm, floorId: e.target.value })
                      setVenuePosition(null)
                    }}
                  >
                    <option value="">Select floor</option>
                    {selectedVenueBuilding?.floors
                      .slice()
                      .sort((a, b) => a.floorNumber - b.floorNumber)
                      .map((floor) => (
                        <option key={floor.id} value={floor.id}>{floorLabel(floor.floorNumber)}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {!selectedVenueBuilding ? (
                  <p style={{ color: 'var(--text-muted)' }}>Select a building to continue</p>
                ) : selectedVenueBuilding.floors.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    No floor plans added for this building yet. Add one from the Buildings tab first.
                  </p>
                ) : selectedVenueFloor ? (
                  <ClickableFloorPlan
                    src={selectedVenueFloor.floorPlanUrl}
                    pendingPercent={venuePosition}
                    onPick={(xPercent, yPercent) => setVenuePosition({ xPercent, yPercent })}
                    label="Click on the floor plan to mark where this room is"
                  />
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Select a floor to place this venue on its floor plan</p>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  Directions (optional)
                </label>
                <input
                  placeholder="e.g. Take the stairs to floor 2, room is on the left"
                  value={venueForm.directions}
                  onChange={(e) => setVenueForm({ ...venueForm, directions: e.target.value })}
                />
              </div>

              <button className="btn-primary" style={{ marginTop: 10 }} onClick={() => void addVenue()} disabled={addingVenue || !venueForm.name.trim()}>
                {addingVenue ? <><span className="spinner" /> Saving...</> : 'Add venue'}
              </button>
            </div>

            {groupedVenues.map(([groupName, list]) => (
              <div key={groupName} className="card" style={{ padding: 14 }}>
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>{groupName}</h3>
                {list.map((venue) => (
                  <div
                    key={venue.id}
                    className="card"
                    style={{ padding: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                  >
                    <div>
                      <p style={{ fontWeight: 700 }}>{venue.name} — {venueLocationLabel(venue)}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        Position: {venue.xPercent != null && venue.yPercent != null ? 'Set' : 'Missing'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-outline"
                      aria-label={`Delete venue ${venue.name}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => void deleteVenue(venue.id)}
                    >
                      Delete
                    </button>
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
