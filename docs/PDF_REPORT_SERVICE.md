# devai-pdf — PDF Report Service
## Documento de Implementación

> Microservicio independiente para generación de PDFs profesionales.
> Reutilizable para cualquier proyecto de la plataforma devai.

---

## 1. Concepto

El servicio recibe un payload JSON con datos estructurados, renderiza HTML con Handlebars y lo convierte a PDF con Puppeteer/Chromium headless. No depende del frontend, del browser del cliente ni de que React esté corriendo.

```
krill-api (Node)
    │
    │  POST http://devai-pdf:3002/pdf/render
    │  { template: "simulation-report", data: {...} }
    ▼
┌────────────────────────────────┐
│        devai-pdf               │
│  Hono → Handlebars → Puppeteer │
│  HTML string → PDF bytes       │
└────────────────────────────────┘
    │
    │  Buffer (application/pdf)
    ▼
krill-api → pipe → Browser (download)
```

**Sin exposición al exterior.** Solo accesible desde la red interna Docker (`krill-network`).

---

## 2. Stack

| Pieza | Elección | Razón |
|-------|----------|-------|
| Runtime | Node 20 Alpine | Consistente con el stack actual |
| Framework | Hono | Consistente con krill-api |
| Templates | Handlebars (`hbs`) | Lógica mínima, separación total datos/presentación |
| PDF engine | Puppeteer + `@sparticuz/chromium` | Chromium headless optimizado para contenedor (~120MB vs ~300MB Puppeteer full) |
| Validación | Zod | Consistente con krill-api |
| Charts | SVG inline en HBS | Sin JS en el template, output idéntico siempre, sin canvas |

---

## 3. Estructura de archivos

```
devai-pdf/
├── Dockerfile
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                        ← Hono server
│   ├── renderer.ts                     ← Puppeteer: HTML → PDF Buffer
│   ├── schema.ts                       ← Zod schemas por template
│   ├── templates/
│   │   ├── simulation-report/
│   │   │   ├── index.hbs               ← Layout con page breaks
│   │   │   ├── partials/
│   │   │   │   ├── cover.hbs
│   │   │   │   ├── executive.hbs
│   │   │   │   ├── findings.hbs        ← charts SVG inline
│   │   │   │   ├── regional.hbs
│   │   │   │   ├── verbatims.hbs
│   │   │   │   └── methodology.hbs
│   │   │   └── styles.css
│   │   └── [future-template]/          ← plug-in para otros proyectos
│   └── helpers/
│       └── hbs-helpers.ts              ← formatDate, stars, truncate, etc.
```

---

## 4. API Contract

### `POST /pdf/render`

**Headers:** `Content-Type: application/json`

**Request body:**

```json
{
  "template": "simulation-report",
  "data": {
    "project": {
      "name": "Galletitas Limón 200g",
      "client": "Arcor",
      "brief": "Lanzamiento Q2 2026...",
      "date": "Abril 2026",
      "confidential": true
    },
    "simulation": {
      "id": 83,
      "model": "ministral-8b-2512",
      "provider": "mistral",
      "agentCount": 100,
      "rounds": 1,
      "costUsd": 0.08,
      "durationSeconds": 180
    },
    "insights": {
      "executiveSummary": "Los consumidores muestran alta receptividad...",
      "purchaseIntentAvg": 3.8,
      "priceConsensus": 1450,
      "recommendRate": 72
    },
    "charts": {
      "intentHistogram": [
        { "score": 1, "pct": 4 },
        { "score": 2, "pct": 11 },
        { "score": 3, "pct": 23 },
        { "score": 4, "pct": 38 },
        { "score": 5, "pct": 24 }
      ],
      "regional": [
        { "country": "AR", "flag": "🇦🇷", "value": 78, "delta": 6 },
        { "country": "MX", "flag": "🇲🇽", "value": 65, "delta": -7 }
      ],
      "recommendation": {
        "yes": 52,
        "maybe": 29,
        "no": 19
      }
    },
    "verbatims": [
      {
        "name": "María",
        "age": 29,
        "country": "AR",
        "segment": "urban",
        "sentiment": "positive",
        "text": "Me parece un precio razonable para lo que ofrece...",
        "intent": 4
      }
    ]
  },
  "options": {
    "format": "A4",
    "margin": {
      "top": "20mm",
      "bottom": "20mm",
      "left": "18mm",
      "right": "18mm"
    }
  }
}
```

**Response exitosa:** `200 OK`
```
Content-Type: application/pdf
Content-Disposition: inline; filename="report.pdf"
[PDF bytes]
```

**Response de error:** `400 | 422 | 500`
```json
{ "error": "Template 'unknown-template' not found" }
```

---

## 5. Implementación del renderer

```typescript
// src/renderer.ts
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function renderPdf(html: string, options: PdfOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: options.format ?? 'A4',
    margin: options.margin ?? { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    printBackground: true,
  })

  await browser.close()
  return Buffer.from(pdf)
}
```

---

## 6. Estructura del reporte — Simulation Report

| Página | Contenido |
|--------|-----------|
| 1 | **Portada**: nombre del proyecto, cliente, fecha, marca devai, "Confidencial" |
| 2 | **Síntesis Ejecutiva**: texto generado por LLM + grid de métricas clave |
| 3 | **Hallazgos**: intent histogram (SVG), precio justo (SVG), recomendación (donut SVG) |
| 4 | **Pulso Regional**: tabla por país con valor e indicador delta |
| 5 | **Verbatims**: 8–10 citas seleccionadas con perfil del agente |
| 6 | **Metodología**: proceso, modelo, segmento target, rounds, disclaimer |

Los charts se renderizan como **SVG inline** dentro del template HBS. Sin canvas, sin JavaScript en el template, output determinístico.

---

## 7. Integración con krill-api

Nuevo endpoint en `krill_app/apps/api/src/routes/reports.ts`:

### `GET /api/reports/simulation/:id/pdf`

```typescript
router.get('/reports/simulation/:id/pdf', async (c) => {
  const simId = Number(c.req.param('id'))

  // 1. Recopilar datos de la DB
  const simulation  = getSimulationDetail(simId)
  const project     = getProject(simulation.projectId)
  const insights    = getInsight(simId, 'executive_summary')
  const agents      = getAgentResponses(simId, { limit: 500 })

  // 2. Construir payload
  const payload = buildSimulationReportPayload({ simulation, project, insights, agents })

  // 3. Llamar al PDF service
  const res = await fetch('http://devai-pdf:3002/pdf/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template: 'simulation-report', data: payload }),
  })

  if (!res.ok) return c.json({ error: 'PDF generation failed' }, 500)

  // 4. Pipe al browser
  const filename = `krill-report-sim-${simId}.pdf`
  c.header('Content-Type', 'application/pdf')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  return c.newResponse(res.body, 200)
})
```

---

## 8. Botón en el frontend

En `SimulationReport.tsx`:

```tsx
<a
  href={`/api/reports/simulation/${simulationId}/pdf`}
  download={`krill-report-sim-${simulationId}.pdf`}
  className="..."
>
  Descargar Reporte PDF
</a>
```

Sin hooks, sin estado, sin loading spinner complejo. El browser maneja la descarga nativamente.

---

## 9. Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
# Dependencias de Chromium en Alpine
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/templates ./src/templates

ENV PORT=3002
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

EXPOSE 3002
CMD ["node", "dist/index.js"]
```

---

## 10. docker-compose (devai-nuevo)

```yaml
devai-pdf:
  build:
    context: ../../devai-pdf
    dockerfile: Dockerfile
  container_name: devai-pdf
  environment:
    - PORT=3002
  networks:
    - krill-network     # accesible desde krill-api
    # NO en proxy-net  → nunca expuesto al exterior
  restart: unless-stopped
```

En `krill-api`, la URL interna es `http://devai-pdf:3002`.

---

## 11. Reutilización para otros proyectos

El servicio es completamente agnóstico al dominio. Para agregar un reporte de cualquier otro proyecto:

1. Crear `src/templates/<nombre-template>/` con su `index.hbs` y partials
2. Definir el schema Zod correspondiente en `schema.ts`
3. El endpoint `POST /pdf/render` con `"template": "<nombre-template>"` lo resuelve automáticamente

No hay que modificar el renderer ni el servidor. **Un solo contenedor, mantenimiento centralizado, cero acoplamiento con el dominio de negocio.**

---

## 12. Orden de implementación

| # | Tarea | Archivos |
|---|-------|---------|
| 1 | Repo `devai-pdf` + Hono server base | `src/index.ts` |
| 2 | Renderer Puppeteer | `src/renderer.ts` |
| 3 | Schema Zod `simulation-report` | `src/schema.ts` |
| 4 | Template HBS + CSS (layout, portada, ejecutivo) | `src/templates/simulation-report/` |
| 5 | Partials: findings, regional, verbatims, metodología | `src/templates/simulation-report/partials/` |
| 6 | Helpers HBS (formatDate, intentStars, sentimentLabel) | `src/helpers/hbs-helpers.ts` |
| 7 | Endpoint `GET /reports/simulation/:id/pdf` en krill-api | `apps/api/src/routes/reports.ts` |
| 8 | Botón descarga en `SimulationReport.tsx` | `apps/web/src/pages/SimulationReport.tsx` |
| 9 | Deploy: agregar `devai-pdf` a `docker-compose.yml` | `krill_app/docker/docker-compose.yml` |

---

## 13. Checklist de validación post-deploy

```
□ devai-pdf container running: docker ps | grep devai-pdf
□ Health check: curl http://devai-pdf:3002/health (desde krill-api container)
□ Test render: POST /pdf/render con payload mínimo → recibe bytes PDF
□ Test integración: GET /api/reports/simulation/83/pdf → descarga archivo
□ Verificar PDF: portada correcta, charts visibles, verbatims legibles
□ Verificar que devai-pdf NO está en proxy-net (no expuesto al exterior)
```
