import { describe, it, expect, vi } from 'vitest'
import app from './index.js'

const BASE_URL = 'http://localhost'

describe('POST /pdf/render', () => {
  it('returns 400 for unknown template', async () => {
    const req = new Request(`${BASE_URL}/pdf/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: 'unknown-template', data: {} }),
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain("unknown-template")
  })

  it('returns 422 for invalid JSON body', async () => {
    const req = new Request(`${BASE_URL}/pdf/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await app.fetch(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid JSON body')
  })
})

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const req = new Request(`${BASE_URL}/health`)
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ status: 'ok' })
  })
})
