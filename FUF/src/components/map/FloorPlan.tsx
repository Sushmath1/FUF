'use client'

import { useState } from 'react'

export interface FloorPlanRoom {
  id: string
  name: string
  xPercent: number
  yPercent: number
  hasActiveEvent?: boolean
  eventName?: string | null
}

interface Props {
  floorPlanUrl: string
  rooms: FloorPlanRoom[]
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
