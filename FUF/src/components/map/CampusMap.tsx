'use client'

import 'leaflet/dist/leaflet.css'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'

type MapInstance = { map: Leaflet.Map; L: typeof Leaflet }
type RouteLayer = Leaflet.Polyline | Leaflet.CircleMarker

export interface CampusMapBuilding {
  id: string
  name: string
  shortName?: string | null
  lat: number
  lng: number
  currentEventName?: string | null
}

interface Props {
  buildings: CampusMapBuilding[]
  center: [number, number]
  selectedBuildingId?: string
  mainGateLat?: number | null
  mainGateLng?: number | null
  onBuildingSelect?: (id: string) => void
}

export default function CampusMap({ buildings, center, selectedBuildingId, mainGateLat, mainGateLng, onBuildingSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<MapInstance | null>(null)
  const markersRef = useRef<Map<string, Leaflet.CircleMarker>>(new Map())
  const routeLayersRef = useRef<RouteLayer[]>([])
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)

  useEffect(() => {
    if (instanceRef.current || !mapRef.current) return

    let cancelled = false

    import('leaflet').then((leafletModule) => {
      if (cancelled || !mapRef.current) return
      const L = leafletModule.default ?? leafletModule

      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      })
      L.Marker.prototype.options.icon = DefaultIcon

      const map = L.map(mapRef.current, { center, zoom: 17, zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
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
        markersRef.current.set(b.id, marker)
      })

      if (mainGateLat && mainGateLng) {
        L.marker([mainGateLat, mainGateLng]).addTo(map).bindPopup('<strong>Main Gate</strong>')
      }

      instanceRef.current = { map, L }
    })

    return () => {
      cancelled = true
      instanceRef.current?.map.remove()
      instanceRef.current = null
      markersRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep marker highlight in sync with the selected building without re-creating the map.
  useEffect(() => {
    if (!instanceRef.current) return
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#06b6d4'
    markersRef.current.forEach((marker, id) => {
      marker.setStyle({ fillColor: id === selectedBuildingId ? primary : '#1e293b' })
    })
  }, [selectedBuildingId])

  const clearRoute = () => {
    const instance = instanceRef.current
    if (!instance) return
    routeLayersRef.current.forEach(layer => instance.map.removeLayer(layer))
    routeLayersRef.current = []
    setRouteInfo(null)
  }

  const getRoute = async () => {
    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
    if (!selectedBuilding || !instanceRef.current) return

    setLoadingRoute(true)
    setLocationError(null)
    clearRoute()

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
        const line = L.polyline(coords, { color: primary, weight: 4, opacity: 0.85 }).addTo(map)
        const userMarker = L.circleMarker([uLat, uLng], { radius: 8, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)
        routeLayersRef.current = [line, userMarker]
        map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })

        setRouteInfo({
          distance: data.routes[0].distance > 1000 ? `${(data.routes[0].distance / 1000).toFixed(1)} km` : `${Math.round(data.routes[0].distance)} m`,
          duration: `${Math.round(data.routes[0].duration / 60)} min walk`,
        })
      } else {
        setLocationError('Could not calculate a walking route.')
      }
    } catch (e) {
      const geoError = e as GeolocationPositionError
      if (geoError.code === 1 && mainGateLat && mainGateLng) {
        setLocationError('Using main gate as start (location access denied)')
        const dashed = L.polyline([[mainGateLat, mainGateLng], [selectedBuilding.lat, selectedBuilding.lng]], {
          color: primary, weight: 3, dashArray: '8 6', opacity: 0.7,
        }).addTo(map)
        routeLayersRef.current = [dashed]
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
