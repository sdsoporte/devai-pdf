import { z } from 'zod'

export const simulationReportSchema = z.object({
  project: z.object({
    name: z.string(),
    client: z.string(),
    brief: z.string(),
    date: z.string(),
    confidential: z.boolean().optional(),
  }),
  simulation: z.object({
    id: z.number(),
    model: z.string(),
    provider: z.string(),
    agentCount: z.number(),
    rounds: z.number(),
    costUsd: z.number(),
    durationSeconds: z.number(),
  }),
  insights: z.object({
    executiveSummary: z.string(),
    purchaseIntentAvg: z.number(),
    priceConsensus: z.number(),
    recommendRate: z.number(),
  }),
  charts: z.object({
    intentHistogram: z.array(
      z.object({
        score: z.number(),
        pct: z.number(),
      })
    ),
    regional: z.array(
      z.object({
        country: z.string(),
        flag: z.string(),
        value: z.number(),
        delta: z.number(),
      })
    ),
    recommendation: z.object({
      yes: z.number(),
      maybe: z.number(),
      no: z.number(),
    }),
  }),
  verbatims: z.array(
    z.object({
      name: z.string(),
      age: z.number(),
      country: z.string(),
      segment: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      text: z.string(),
      intent: z.number(),
    })
  ),
})

export type SimulationReportData = z.infer<typeof simulationReportSchema>

export const renderRequestSchema = z.object({
  template: z.string(),
  data: z.unknown(),
  options: z
    .object({
      format: z.enum(['A4', 'Letter']).optional(),
      margin: z
        .object({
          top: z.string(),
          bottom: z.string(),
          left: z.string(),
          right: z.string(),
        })
        .optional(),
    })
    .optional(),
})

export type RenderRequest = z.infer<typeof renderRequestSchema>

export type PdfOptions = {
  format?: 'A4' | 'Letter'
  margin?: { top: string; bottom: string; left: string; right: string }
}

const templateRegistry: Record<string, z.ZodSchema> = {
  'simulation-report': simulationReportSchema,
}

export function getTemplateSchema(templateName: string): z.ZodSchema | undefined {
  return templateRegistry[templateName]
}

export function listTemplates(): string[] {
  return Object.keys(templateRegistry)
}
