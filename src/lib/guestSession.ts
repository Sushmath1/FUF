export const GUEST_KEY = 'fuf_guest_id'

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(GUEST_KEY)
  if (existing) return existing
  const id = `guest_${crypto.randomUUID()}`
  localStorage.setItem(GUEST_KEY, id)
  return id
}

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GUEST_KEY)
}