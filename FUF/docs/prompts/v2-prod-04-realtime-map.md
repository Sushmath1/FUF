# PROMPT 4: Real-time Notifications + Campus Map
# FindUrFest — Full production build with AI

## Prerequisites
Prompts 1, 2, and 3 fully complete.

---

# PART 1: REAL-TIME WITH PUSHER

Sign up at pusher.com → Create Channels app → Cluster: ap2 → Copy keys to .env.local

## FILE: src/lib/usePusherUpdates.ts

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'

export function usePusherUpdates(eventIds: string[], onUpdate: () => void) {
  const pusherRef = useRef<Pusher | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (eventIds.length === 0 || !process.env.NEXT_PUBLIC_PUSHER_KEY) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'ap2',
    })
    pusherRef.current = pusher

    pusher.connection.bind('connected', () => setIsConnected(true))
    pusher.connection.bind('disconnected', () => setIsConnected(false))
    pusher.connection.bind('error', () => setIsConnected(false))

    const channels = eventIds.map(eventId => {
      const ch = pusher.subscribe(`event-${eventId}`)

      ch.bind('venue-changed', (data: any) => {
        toast(`📍 Venue updated: ${data.newVenueName}`, {
          icon: '🔔',
          duration: 7000,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--primary)',
          },
        })
        onUpdate()
      })

      ch.bind('event-cancelled', (data: any) => {
        toast(`❌ ${data.eventName} has been cancelled`, {
          duration: 10000,
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid #ef4444',
          },
        })
        onUpdate()
      })

      return ch
    })

    return () => {
      channels.forEach(ch => ch.unbind_all())
      eventIds.forEach(id => pusher.unsubscribe(`event-${id}`))
      pusher.disconnect()
    }
  }, [eventIds.join(','), onUpdate])

  return { isConnected }
}
```

---

## FILE: src/lib/useOfflineCache.ts

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { openDB } from 'idb'

const DB = 'fuf-v1'
const STORE = 'cache'

async function getDB() {
  return openDB(DB, 1, {
    upgrade(db) { if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE) },
  })
}

export function useOfflineCache(key: string) {
  const [isOffline, setIsOffline] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [cachedData, setCachedData] = useState<unknown>(null)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)

    getDB()
      .then(db => db.get(STORE, key))
      .then(cached => {
        if (cached) { setCachedData(cached.data); setLastSyncedAt(cached.savedAt) }
      })
      .catch(() => {})

    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [key])

  const updateCache = useCallback(async (data: unknown) => {
    const record = { data, savedAt: new Date().toISOString() }
    try { const db = await getDB(); await db.put(STORE, record, key) } catch {}
    setLastSyncedAt(record.savedAt)
    setCachedData(data)
  }, [key])

  return { isOffline, lastSyncedAt, cachedData, updateCache }
}
```

---

# PART 2: CAMPUS MAP

## FILE: src/components/map/CampusMap.tsx
CRITICAL: This file uses Leaflet. Must be imported with dynamic() + ssr:false in any page that uses it.

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'

interface Building { id: string; name: string; shortName?: string | null; lat: number; lng: number; currentEventName?: string | null }

interface Props {
  buildings: Building[]
  center: [number, number]
  selectedBuildingId?: string
  mainGateLat?: number | null
  mainGateLng?: number | null
  onBuildingSelect?: (id: string) => void
}

export default function CampusMap({ buildings, center, selectedBuildingId, mainGateLat, mainGateLng, onBuildingSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return

    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css' as any)]).then(([L]) => {
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      })
      L.Marker.prototype.options.icon = DefaultIcon

      const map = L.map(mapRef.current!, { center, zoom: 17, zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)

      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4'

      buildings.forEach(b => {
        const marker = L.circleMarker([b.lat, b.lng], {
          radius: 11, fillColor: b.id === selectedBuildingId ? primary : '#1e293b',
          color: primary, weight: 2.5, opacity: 1, fillOpacity: 0.85,
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:120px;padding:4px">
            <strong>${b.name}</strong>
            ${b.currentEventName ? `<br/><span style="color:#f59e0b;font-size:12px">${b.currentEventName}</span>` : ''}
          </div>
        `)

        if (onBuildingSelect) marker.on('click', () => onBuildingSelect(b.id))
      })

      if (mainGateLat && mainGateLng) {
        L.marker([mainGateLat, mainGateLng]).addTo(map).bindPopup('<strong>Main Gate</strong>')
      }

      instanceRef.current = { map, L }
    })

    return () => { instanceRef.current?.map.remove(); instanceRef.current = null }
  }, [])

  const getRoute = async () => {
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding || !instanceRef.current) return

    setLoadingRoute(true)
    setLocationError(null)

    const { map, L } = instanceRef.current
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4'

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      )

      const [uLat, uLng] = [pos.coords.latitude, pos.coords.longitude]

      const data = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${uLng},${uLat};${selectedBuilding.lng},${selectedBuilding.lat}?overview=full&geometries=geojson`
      ).then(r => r.json())

      if (data.code === 'Ok' && data.routes[0]) {
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng])
        L.polyline(coords, { color: primary, weight: 4, opacity: 0.85 }).addTo(map)
        L.circleMarker([uLat, uLng], { radius: 8, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })

        setRouteInfo({
          distance: data.routes[0].distance > 1000 ? `${(data.routes[0].distance / 1000).toFixed(1)} km` : `${Math.round(data.routes[0].distance)} m`,
          duration: `${Math.round(data.routes[0].duration / 60)} min walk`,
        })
      }
    } catch (e: any) {
      if (e.code === 1 && mainGateLat && mainGateLng) {
        setLocationError('Using main gate as start (location access denied)')
        L.polyline([[mainGateLat, mainGateLng], [selectedBuilding.lat, selectedBuilding.lng]], {
          color: primary, weight: 3, dashArray: '8 6', opacity: 0.7,
        }).addTo(map)
      } else {
        setLocationError('Could not get your location. Please enable GPS.')
      }
    } finally {
      setLoadingRoute(false)
    }
  }

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)

  return (
    <div style={{ position: 'relative' }}>
      {/* MUST have explicit height or map renders blank white */}
      <div ref={mapRef} style={{ height: '380px', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }} />

      {routeInfo && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 500, background: 'rgba(3,7,18,0.9)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--primary)', fontSize: 13, color: 'var(--text)' }}>
          🚶 {routeInfo.duration} · {routeInfo.distance}
        </div>
      )}

      {selectedBuilding && (
        <button onClick={getRoute} disabled={loadingRoute} className="btn-primary"
          style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 500, padding: '8px 16px', fontSize: 13 }}>
          {loadingRoute ? <><span className="spinner" /> Finding route...</> : `Route to ${selectedBuilding.shortName ?? selectedBuilding.name}`}
        </button>
      )}

      {locationError && (
        <div style={{ marginTop: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f59e0b' }}>
          ℹ️ {locationError}
        </div>
      )}
    </div>
  )
}
```

---

## FILE: src/components/map/FloorPlan.tsx

```typescript
'use client'
import { useState } from 'react'

interface Room { id: string; name: string; xPercent: number; yPercent: number; hasActiveEvent?: boolean; eventName?: string | null }

interface Props {
  floorPlanUrl: string
  rooms: Room[]
  selectedRoomId?: string
  entranceXPercent?: number
  entranceYPercent?: number
  onRoomSelect?: (id: string) => void
}

export function FloorPlan({ floorPlanUrl, rooms, selectedRoomId, entranceXPercent = 50, entranceYPercent = 92, onRoomSelect }: Props) {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const selected = rooms.find(r => r.id === selectedRoomId)

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <img
        src={floorPlanUrl}
        alt="Floor plan"
        style={{ width: '100%', display: 'block', opacity: 0.88 }}
        onLoad={e => { const img = e.target as HTMLImageElement; setImgSize({ w: img.offsetWidth, h: img.offsetHeight }) }}
      />

      {selected && imgSize.w > 0 && (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox={`0 0 ${imgSize.w} ${imgSize.h}`} preserveAspectRatio="none">
          <line x1={`${entranceXPercent}%`} y1={`${entranceYPercent}%`}
            x2={`${selected.xPercent}%`} y2={`${selected.yPercent}%`}
            stroke="var(--primary)" strokeWidth="3" strokeDasharray="10 5" />
          <circle cx={`${entranceXPercent}%`} cy={`${entranceYPercent}%`} r="6" fill="#22c55e" />
        </svg>
      )}

      {rooms.map(room => {
        const isSel = room.id === selectedRoomId
        return (
          <div key={room.id} onClick={() => onRoomSelect?.(room.id)}
            style={{ position: 'absolute', left: `${room.xPercent}%`, top: `${room.yPercent}%`, transform: 'translate(-50%,-50%)', zIndex: isSel ? 20 : 10, cursor: 'pointer' }}>
            <div style={{
              width: isSel ? 20 : 14, height: isSel ? 20 : 14, borderRadius: '50%',
              background: isSel ? 'var(--primary)' : room.hasActiveEvent ? '#f59e0b' : '#334155',
              border: `2px solid ${isSel ? 'white' : 'var(--border)'}`,
              boxShadow: isSel ? '0 0 12px var(--glow)' : 'none',
              transition: 'all 0.2s',
            }} />
            <div style={{
              position: 'absolute', top: isSel ? 24 : 18, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(3,7,18,0.92)', color: isSel ? 'var(--primary)' : 'var(--text)',
              padding: '2px 8px', borderRadius: 4, fontSize: 11,
              fontWeight: isSel ? 700 : 400, whiteSpace: 'nowrap',
              border: isSel ? '1px solid var(--primary)' : 'none',
            }}>
              {room.name}
            </div>
          </div>
        )
      })}

      <div style={{
        position: 'absolute', left: `${entranceXPercent}%`, top: `${entranceYPercent}%`,
        transform: 'translate(-50%,-50%)', background: '#22c55e', color: '#000',
        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, zIndex: 15,
      }}>
        Entrance
      </div>
    </div>
  )
}
```

---

## FILE: src/app/visitor/map/page.tsx

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FloorPlan } from '@/components/map/FloorPlan'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'

// CRITICAL: ssr:false — Leaflet crashes on server
const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 380, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
      Loading map...
    </div>
  ),
})

export default function MapPage() {
  const searchParams = useSearchParams()
  const collegeId = searchParams.get('collegeId')
  const preselectedVenueId = searchParams.get('venueId')

  const [college, setCollege] = useState<any>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(preselectedVenueId)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!collegeId) { setLoading(false); return }
    fetch(`/api/colleges/${collegeId}`)
      .then(r => r.json())
      .then(data => {
        setCollege(data)
        if (preselectedVenueId) {
          for (const b of data.buildings ?? []) {
            if (b.venues?.find((v: any) => v.id === preselectedVenueId)) { setSelectedBuildingId(b.id); break }
          }
        }
      })
      .finally(() => setLoading(false))
  }, [collegeId, preselectedVenueId])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)' }}>Loading campus map...</div>
    </main>
  )

  if (!college) return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#ef4444' }}>College not found</div>
    </main>
  )

  const buildings = (college.buildings ?? []).filter((b: any) => b.lat && b.lng)
  const selectedBuilding = college.buildings?.find((b: any) => b.id === selectedBuildingId)

  return (
    <ThemeProvider
      primaryColor={college.primaryColor} secondaryColor={college.secondaryColor}
      accentColor={college.accentColor} bgColor={college.bgColor}
      surfaceColor={college.surfaceColor} fontStyle={college.fontStyle}
      moodText={college.moodText} particleStyle={college.particleStyle}
    >
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingTop: 72 }}>
        <Navbar />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{college.name} Campus</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Tap a building to see indoor navigation</p>

            {buildings.length > 0 ? (
              <CampusMap
                buildings={buildings}
                center={[college.mainGateLat ?? buildings[0]?.lat ?? 13.0827, college.mainGateLng ?? buildings[0]?.lng ?? 80.2707]}
                selectedBuildingId={selectedBuildingId ?? undefined}
                mainGateLat={college.mainGateLat}
                mainGateLng={college.mainGateLng}
                onBuildingSelect={setSelectedBuildingId}
              />
            ) : (
              <div style={{ height: 200, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Campus map not configured yet
              </div>
            )}

            {(college.buildings ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {college.buildings.map((b: any) => (
                  <button key={b.id} onClick={() => setSelectedBuildingId(b.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, border: '1px solid',
                      borderColor: selectedBuildingId === b.id ? 'var(--primary)' : 'var(--border)',
                      background: selectedBuildingId === b.id ? 'var(--glow)' : 'transparent',
                      color: selectedBuildingId === b.id ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}>
                    {b.shortName ?? b.name}
                  </button>
                ))}
              </div>
            )}

            {selectedBuilding?.floorPlanUrl && (
              <motion.div key={selectedBuildingId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selectedBuilding.name} — Floor plan</h2>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search room..."
                    style={{ width: 140, padding: '6px 12px', fontSize: 13 }} />
                </div>
                <FloorPlan
                  floorPlanUrl={selectedBuilding.floorPlanUrl}
                  rooms={(selectedBuilding.venues ?? [])
                    .filter((v: any) => v.xPercent != null && v.yPercent != null)
                    .filter((v: any) => !search || v.name.toLowerCase().includes(search.toLowerCase()))
                    .map((v: any) => ({ id: v.id, name: v.name, xPercent: v.xPercent, yPercent: v.yPercent }))}
                  selectedRoomId={selectedVenueId ?? undefined}
                  entranceXPercent={selectedBuilding.entranceXPercent ?? 50}
                  entranceYPercent={selectedBuilding.entranceYPercent ?? 92}
                  onRoomSelect={setSelectedVenueId}
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </ThemeProvider>
  )
}
```

---

## Testing

### Test Pusher:
1. Add keys to .env.local from pusher.com
2. Open visitor schedule in one tab
3. Admin changes a venue in another tab
4. Visitor tab shows toast within 1-2 seconds — no refresh needed

### Test map:
1. Go to /visitor/map?collegeId=[valid-id]
2. Map must show a real map — if blank white, the CampusMap div is missing its height
3. Click "Route to [building]" → accepts GPS → draws colored route line

### Test offline:
1. Load visitor schedule
2. DevTools → Network → Offline
3. Refresh → cached schedule shows with amber banner

`git add . && git commit -m "prompt 4 realtime and map done"`
