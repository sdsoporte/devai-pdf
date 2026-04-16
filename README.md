# devai-pdf — PDF Report Service

Microservicio independiente de generación de PDFs para la plataforma devai. Recibe un payload JSON, renderiza HTML con Handlebars y lo convierte a PDF con Puppeteer/Chromium headless.

Sin dependencia del frontend ni del browser del cliente. Reutilizable por cualquier proyecto de la plataforma.

---

## Stack

| Pieza | Elección |
|-------|----------|
| Runtime | Node 20 Alpine |
| Framework | Hono + `@hono/node-server` |
| Templates | Handlebars (`hbs`) |
| PDF engine | Puppeteer Core + Chromium del sistema (`apk`) |
| Validación | Zod |
| Charts | SVG inline en HBS — sin canvas, output determinístico |

---

## API

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /pdf/render`

```json
{
  "template": "simulation-report",
  "data": { ... },
  "options": {
    "format": "A4",
    "margin": { "top": "20mm", "bottom": "20mm", "left": "18mm", "right": "18mm" }
  }
}
```

**Response exitosa**: `200 application/pdf` — bytes del PDF.  
**Errores**: `400 | 422 | 500` con `{ "error": "..." }`.

---

## Templates disponibles

| Template | Páginas | Descripción |
|----------|---------|-------------|
| `simulation-report` | 6 | Portada, síntesis ejecutiva, hallazgos (charts SVG), pulso regional, verbatims, metodología |

Para agregar un template nuevo: crear `src/templates/<nombre>/index.hbs` con sus partials y registrar el schema Zod en `src/schema.ts`. No se modifica el renderer ni el servidor.

---

## Estructura

```
devai-pdf/
├── src/
│   ├── index.ts                    ← Hono server (puerto 3002)
│   ├── renderer.ts                 ← Puppeteer: HTML → PDF Buffer
│   ├── schema.ts                   ← Zod schemas + template registry
│   ├── helpers/
│   │   └── hbs-helpers.ts          ← formatDate, intentStars (SafeString), math helpers
│   └── templates/
│       └── simulation-report/
│           ├── index.hbs
│           ├── styles.css
│           └── partials/
│               ├── cover.hbs
│               ├── executive.hbs
│               ├── findings.hbs    ← charts SVG inline
│               ├── regional.hbs
│               ├── verbatims.hbs
│               └── methodology.hbs
└── Dockerfile                      ← Multi-stage Alpine, Chromium via apk
```

---

## Variables de entorno

```env
PORT=3002                          # default
CHROMIUM_PATH=/usr/bin/chromium-browser  # default en Alpine
```

---

## Desarrollo local

```bash
npm install
npm run dev      # tsx watch
npm test         # vitest (29 tests)
npm run build    # tsc
```

---

## Deploy (Docker)

El servicio vive en `krill-network` — **nunca expuesto a internet**.

```bash
# Desde krill_app/docker/
docker compose up -d --build devai-pdf

# Health check desde krill-api
docker exec krill-api wget -qO- http://devai-pdf:3002/health
```

### Notas de implementación

- `@sparticuz/chromium` **no se usa** — está optimizado para Lambda, no para Docker Alpine. Se usa el Chromium instalado con `apk`.
- **Browser pool:** se mantiene una única instancia de Chromium y se reutilizan páginas con un semáforo de 5 concurrentes. No se lanza un browser por request.
- **Handlebars partials** se registran **una sola vez al startup**, no en cada request.
- **Rate limiting** por IP está activo en todo el servicio.
- `intentStars` helper usa `Handlebars.SafeString` — sin esto Handlebars escapa los tags HTML con doble-stash `{{}}`.
- Hono requiere `@hono/node-server` + `serve()` para correr en Node.js standalone (el export serverless solo no arranca el proceso).
