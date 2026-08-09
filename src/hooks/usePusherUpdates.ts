'use client'

import { useEffect, useMemo, useState } from 'react'
import Pusher, { Channel } from 'pusher-js'

type VenueChangedPayload = {
  eventId: string
  newVenueName: string
  previousVenueName: string
  changedAt: string
}

type CancelledPayload = {
  eventId: string
  eventName: string
  cancelledAt: string
}

interface PusherHandlers {
  eventIds: string[]
  onVenueChanged: (payload: VenueChangedPayload) => void
  onEventCancelled: (payload: CancelledPayload) => void
}

export function usePusherUpdates({ eventIds, onVenueChanged, onEventCancelled }: PusherHandlers) {
  const [isConnected, setIsConnected] = useState(false)

  const enabled = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
  }, [])

  useEffect(() => {
    if (!enabled || eventIds.length === 0) {
      setIsConnected(false)
      return
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channels: Channel[] = []

    pusher.connection.bind('connected', () => setIsConnected(true))
    pusher.connection.bind('disconnected', () => setIsConnected(false))
    pusher.connection.bind('error', () => setIsConnected(false))

    for (const eventId of eventIds) {
      const channel = pusher.subscribe(`event-${eventId}`)
      channel.bind('venue-changed', onVenueChanged)
      channel.bind('event-cancelled', onEventCancelled)
      channels.push(channel)
    }

    return () => {
      for (const channel of channels) {
        channel.unbind('venue-changed', onVenueChanged)
        channel.unbind('event-cancelled', onEventCancelled)
        pusher.unsubscribe(channel.name)
      }
      pusher.disconnect()
    }
  }, [enabled, eventIds, onVenueChanged, onEventCancelled])

  return { isConnected }
}
