import { describe, it, expect } from 'vitest'
import { renderPdf } from './renderer'
import { existsSync } from 'fs'

describe('renderPdf integration', () => {
  it('returns a non-empty Buffer for minimal HTML', async () => {
    // Skip if Chromium is not installed (e.g., local dev without Docker)
    const chromiumPath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser'
    if (!existsSync(chromiumPath)) {
      console.log(`Skipping integration test: Chromium not found at ${chromiumPath}`)
      return
    }

    const html = `
      <html>
        <head><title>Test</title></head>
        <body><h1>Hello PDF</h1></body>
      </html>
    `
    const pdf = await renderPdf(html, {})
    expect(pdf).toBeInstanceOf(Buffer)
    expect(pdf.length).toBeGreaterThan(0)
    expect(pdf.toString('ascii', 0, 4)).toBe('%PDF')
  }, 30000)
})
