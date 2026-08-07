'use client'

import { useCallback, useEffect, useState } from 'react'

export function useOfflineCache<T>(key: string) {
  const [cached, setCached] = useState<T | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = localStorage.getItem(key)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as { data: T; savedAt: string }
      setCached(parsed.data)
      setLastSavedAt(parsed.savedAt)
    } catch {
      localStorage.removeItem(key)
    }
  }, [key])

  const save = useCallback(
    (data: T) => {
      const payload = { data, savedAt: new Date().toISOString() }
      localStorage.setItem(key, JSON.stringify(payload))
      setCached(data)
      setLastSavedAt(payload.savedAt)
    },
    [key],
  )

  return { cached, save, lastSavedAt }
}
