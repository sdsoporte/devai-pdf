import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import type { PdfOptions } from './schema.js'

const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
]

const MAX_PAGES = Number(process.env.PDF_MAX_PAGES) || 5

class Semaphore {
  private permits: number
  private waiters: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve)
    })
  }

  release(): void {
    const next = this.waiters.shift()
    if (next) {
      next()
    } else {
      this.permits++
    }
  }
}

let browserPromise: Promise<Browser> | null = null

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser'
    browserPromise = puppeteer.launch({
      args: CHROMIUM_ARGS,
      executablePath,
      headless: true,
    })
  }
  return browserPromise
}

const pageSem = new Semaphore(MAX_PAGES)

export async function renderPdf(html: string, options: PdfOptions): Promise<Buffer> {
  await pageSem.acquire()
  const browser = await getBrowser()
  let page: Page | null = null
  try {
    page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: options.format ?? 'A4',
      margin: options.margin ?? { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
      printBackground: true,
    })

    return Buffer.from(pdf)
  } finally {
    if (page) {
      await page.close()
    }
    pageSem.release()
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close()
    browserPromise = null
  }
}
