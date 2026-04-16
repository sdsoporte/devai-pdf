import { describe, it, expect } from 'vitest'
import { renderPdf } from './renderer'

describe('renderPdf integration', () => {
  it('returns a non-empty Buffer for minimal HTML', async () => {
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
