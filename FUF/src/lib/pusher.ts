import Pusher from 'pusher'

let instance: Pusher | null = null

function getPusher() {
  if (!instance) {
    instance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }

  return instance
}

export async function notifyVenueChange(
  eventId: string,
  newVenueName: string,
  previousVenueName: string,
) {
  try {
    await getPusher().trigger(`event-${eventId}`, 'venue-changed', {
      eventId,
      newVenueName,
      previousVenueName,
      changedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Pusher] notifyVenueChange failed:', e)
  }
}

export async function notifyEventCancelled(eventId: string, eventName: string) {
  try {
    await getPusher().trigger(`event-${eventId}`, 'event-cancelled', {
      eventId,
      eventName,
      cancelledAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[Pusher] notifyEventCancelled failed:', e)
  }
}
