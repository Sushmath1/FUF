'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'

function ClickCapture({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MiniMap({
  points,
  onMapClick,
  pendingPoint,
  pendingLabel,
}: {
  points: Array<{ label: string; lat: number; lng: number }>
  onMapClick?: (lat: number, lng: number) => void
  pendingPoint?: { lat: number; lng: number } | null
  pendingLabel?: string
}) {
  const center = points[0] ? [points[0].lat, points[0].lng] : [12.9716, 77.5946]

  return (
    <div style={{ width: '100%', height: 280 }}>
      <MapContainer
        center={center as [number, number]}
        zoom={16}
        style={{ width: '100%', height: '100%', borderRadius: 10, cursor: onMapClick ? 'crosshair' : undefined }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickCapture onMapClick={onMapClick} />}
        {points.map((point, index) => (
          <Marker key={`${point.label}-${index}`} position={[point.lat, point.lng]}>
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
        {pendingPoint && (
          <Marker position={[pendingPoint.lat, pendingPoint.lng]}>
            <Popup>{pendingLabel || 'New location'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
