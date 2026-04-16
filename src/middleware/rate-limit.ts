import type { Context, Next } from 'hono'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

const ipMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit() {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const record = ipMap.get(ip)

    if (!record || now > record.resetAt) {
      ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      return await next()
    }

    if (record.count >= MAX_REQUESTS) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }

    record.count++
    return await next()
  }
}
