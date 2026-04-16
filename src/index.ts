import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import Handlebars from 'handlebars'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { renderPdf } from './renderer.js'
import { renderRequestSchema, getTemplateSchema } from './schema.js'
import { registerHelpers } from './helpers/hbs-helpers.js'

registerHelpers()

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.post('/pdf/render', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = renderRequestSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.format() }, 422)
  }

  const { template, data, options } = parsed.data

  if (!template) {
    return c.json({ error: 'Missing template' }, 422)
  }

  const schema = getTemplateSchema(template)
  if (!schema) {
    return c.json({ error: `Template '${template}' not found` }, 400)
  }

  const dataParsed = schema.safeParse(data)
  if (!dataParsed.success) {
    return c.json({ error: 'Data validation failed', details: dataParsed.error.format() }, 422)
  }

  try {
    const html = await compileTemplate(template, dataParsed.data)
    const pdf = await renderPdf(html, {
      format: options?.format ?? 'A4',
      margin: options?.margin ?? { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    })

    c.header('Content-Type', 'application/pdf')
    c.header('Content-Disposition', 'inline; filename="report.pdf"')
    return c.newResponse(new Uint8Array(pdf), 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

async function compileTemplate(templateName: string, data: unknown): Promise<string> {
  const templatesDir = path.resolve(process.cwd(), 'src/templates', templateName)

  // Register partials
  const partialsDir = path.join(templatesDir, 'partials')
  try {
    const partialFiles = await fs.readdir(partialsDir)
    for (const file of partialFiles) {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs')
        const content = await fs.readFile(path.join(partialsDir, file), 'utf-8')
        Handlebars.registerPartial(name, content)
      }
    }
  } catch {
    // partials dir may not exist
  }

  // Read styles
  let styles = ''
  try {
    styles = await fs.readFile(path.join(templatesDir, 'styles.css'), 'utf-8')
  } catch {
    // styles may not exist
  }

  // Compile main template
  const indexPath = path.join(templatesDir, 'index.hbs')
  const templateSource = await fs.readFile(indexPath, 'utf-8')
  const compiled = Handlebars.compile(templateSource)

  return compiled({ ...(data as Record<string, unknown>), styles })
}

const port = Number(process.env.PORT) || 3002

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({
    fetch: app.fetch,
    port,
  })
  console.log(`devai-pdf listening on port ${port}`)
}

export default app
