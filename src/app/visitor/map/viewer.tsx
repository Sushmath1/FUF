'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

export function CampusMapViewer({ points }: { points: Array<{ label: string; lat: number; lng: number }> }) {
  const defaultCenter = points[0] ? [points[0].lat, points[0].lng] : [12.9716, 77.5946]

  return (
    <div style={{ height: 420, width: '100%' }}>
      <MapContainer center={defaultCenter as [number, number]} zoom={16} style={{ height: '100%', width: '100%', borderRadius: 10 }}>
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
