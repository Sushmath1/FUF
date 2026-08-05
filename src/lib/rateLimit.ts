interface RateLimitRecord { count: number; resetAt: number }

const store = new Map<string, RateLimitRecord>()

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(id: string, max = 5, windowMs = 60000) {
  const now = Date.now()
  const record = store.get(id)

  if (!record || now > record.resetAt) {
    store.set(id, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: max - 1 }
  }

  if (record.count >= max) return { success: false, remaining: 0 }

  record.count++
  return { success: true, remaining: max - record.count }
}

export function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}