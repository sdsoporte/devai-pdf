import { describe, it, expect } from 'vitest'
import {
  renderRequestSchema,
  simulationReportSchema,
  getTemplateSchema,
  listTemplates,
} from './schema'

const validSimulationData = {
  project: {
    name: 'Test Project',
    client: 'Test Client',
    brief: 'A brief description',
    date: '2024-01-15',
    confidential: true,
  },
  simulation: {
    id: 1,
    model: 'gpt-4',
    provider: 'openai',
    agentCount: 50,
    rounds: 3,
    costUsd: 0.5,
    durationSeconds: 120,
  },
  insights: {
    executiveSummary: 'Summary text',
    purchaseIntentAvg: 3.5,
    priceConsensus: 100,
    recommendRate: 75,
  },
  charts: {
    intentHistogram: [
      { score: 1, pct: 10 },
      { score: 2, pct: 20 },
      { score: 3, pct: 30 },
      { score: 4, pct: 25 },
      { score: 5, pct: 15 },
    ],
    regional: [
      { country: 'AR', flag: '🇦🇷', value: 80, delta: 5 },
    ],
    recommendation: {
      yes: 60,
      maybe: 20,
      no: 20,
    },
  },
  verbatims: [
    {
      name: 'Ana',
      age: 30,
      country: 'AR',
      segment: 'urban',
      sentiment: 'positive',
      text: 'Great product!',
      intent: 4,
    },
  ],
}

describe('renderRequestSchema', () => {
  it('accepts a valid payload', () => {
    const result = renderRequestSchema.safeParse({
      template: 'simulation-report',
      data: validSimulationData,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing template', () => {
    const result = renderRequestSchema.safeParse({
      data: validSimulationData,
    })
    expect(result.success).toBe(false)
  })

  it('accepts payload with undefined data (inner schema will catch it)', () => {
    const result = renderRequestSchema.safeParse({
      template: 'simulation-report',
    })
    // renderRequestSchema uses z.unknown() which may accept missing keys
    // the template data schema enforces structure downstream
    expect(result.success).toBe(true)
  })

  it('accepts optional options', () => {
    const result = renderRequestSchema.safeParse({
      template: 'simulation-report',
      data: validSimulationData,
      options: {
        format: 'A4',
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('simulationReportSchema', () => {
  it('accepts valid simulation data', () => {
    const result = simulationReportSchema.safeParse(validSimulationData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid sentiment value', () => {
    const invalid = {
      ...validSimulationData,
      verbatims: [
        {
          ...validSimulationData.verbatims[0],
          sentiment: 'unknown',
        },
      ],
    }
    const result = simulationReportSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required field', () => {
    const invalid = {
      ...validSimulationData,
      project: { name: 'Test' }, // missing client, brief, date
    }
    const result = simulationReportSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('template registry', () => {
  it('returns schema for known template', () => {
    expect(getTemplateSchema('simulation-report')).toBeDefined()
  })

  it('returns undefined for unknown template', () => {
    expect(getTemplateSchema('unknown-template')).toBeUndefined()
  })

  it('lists registered templates', () => {
    expect(listTemplates()).toContain('simulation-report')
  })
})
