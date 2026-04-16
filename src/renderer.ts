import puppeteer from 'puppeteer-core'
import type { PdfOptions } from './schema.js'

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
]

export async function renderPdf(html: string, options: PdfOptions): Promise<Buffer> {
  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser'

  const browser = await puppeteer.launch({
    args: CHROMIUM_ARGS,
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: options.format ?? 'A4',
      margin: options.margin ?? { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
      printBackground: true,
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
