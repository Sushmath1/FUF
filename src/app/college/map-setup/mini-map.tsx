'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

export function MiniMap({ points }: { points: Array<{ label: string; lat: number; lng: number }> }) {
  const center = points[0] ? [points[0].lat, points[0].lng] : [12.9716, 77.5946]

  return (
    <div style={{ width: '100%', height: 280 }}>
      <MapContainer center={center as [number, number]} zoom={16} style={{ width: '100%', height: '100%', borderRadius: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => (
          <Marker key={`${point.label}-${index}`} position={[point.lat, point.lng]}>
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
