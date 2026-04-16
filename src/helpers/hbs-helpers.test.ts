import { describe, it, expect, beforeAll } from 'vitest'
import Handlebars from 'handlebars'
import { registerHelpers } from './hbs-helpers'

beforeAll(() => {
  registerHelpers()
})

describe('formatDate helper', () => {
  it('formats ISO date to locale string', () => {
    const template = Handlebars.compile('{{formatDate date}}')
    const html = template({ date: '2024-01-15T12:00:00Z' })
    expect(html).toContain('2024')
    expect(html).toContain('enero')
  })

  it('returns empty string for falsy value', () => {
    const template = Handlebars.compile('{{formatDate date}}')
    const html = template({ date: null })
    expect(html).toBe('')
  })
})

describe('intentStars helper', () => {
  it('returns 5 filled stars for intent 5', () => {
    const template = Handlebars.compile('{{intentStars intent}}')
    const html = template({ intent: 5 })
    expect(html).toContain('★★★★★')
    expect(html).not.toContain('☆')
  })

  it('returns 3 filled and 2 empty for intent 3', () => {
    const template = Handlebars.compile('{{intentStars intent}}')
    const html = template({ intent: 3 })
    expect(html).toContain('★★★')
    expect(html).toContain('☆☆')
  })

  it('clamps out-of-range values', () => {
    const template = Handlebars.compile('{{intentStars intent}}')
    expect(template({ intent: 0 })).toContain('★')
    expect(template({ intent: 10 })).toContain('★★★★★')
  })
})

describe('sentimentLabel helper', () => {
  it('maps positive to Positivo', () => {
    const template = Handlebars.compile('{{sentimentLabel sentiment}}')
    expect(template({ sentiment: 'positive' })).toBe('Positivo')
  })

  it('maps neutral to Neutral', () => {
    const template = Handlebars.compile('{{sentimentLabel sentiment}}')
    expect(template({ sentiment: 'neutral' })).toBe('Neutral')
  })

  it('maps negative to Negativo', () => {
    const template = Handlebars.compile('{{sentimentLabel sentiment}}')
    expect(template({ sentiment: 'negative' })).toBe('Negativo')
  })

  it('falls back to original value for unknown sentiment', () => {
    const template = Handlebars.compile('{{sentimentLabel sentiment}}')
    expect(template({ sentiment: 'unknown' })).toBe('unknown')
  })
})

describe('truncate helper', () => {
  it('returns original text when within limit', () => {
    const template = Handlebars.compile('{{truncate text 20}}')
    expect(template({ text: 'Short text' })).toBe('Short text')
  })

  it('truncates text exceeding limit', () => {
    const template = Handlebars.compile('{{truncate text 10}}')
    const result = template({ text: 'This is a very long text' })
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(11)
  })

  it('returns empty string for falsy value', () => {
    const template = Handlebars.compile('{{truncate text 10}}')
    expect(template({ text: null })).toBe('')
  })
})

describe('math helpers', () => {
  it('adds two numbers', () => {
    const template = Handlebars.compile('{{add 2 3}}')
    expect(template({})).toBe('5')
  })

  it('multiplies two numbers', () => {
    const template = Handlebars.compile('{{multiply 4 5}}')
    expect(template({})).toBe('20')
  })

  it('compares greaterThan', () => {
    const template = Handlebars.compile('{{#if (greaterThan 5 3)}}yes{{else}}no{{/if}}')
    expect(template({})).toBe('yes')
  })
})
