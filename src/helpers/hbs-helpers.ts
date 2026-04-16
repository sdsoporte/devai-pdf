import Handlebars from 'handlebars'

export function registerHelpers(): void {
  Handlebars.registerHelper('formatDate', function (date: string | Date): string {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return String(date)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  })

  Handlebars.registerHelper('intentStars', function (intent: number): Handlebars.SafeString {
    const score = Math.max(1, Math.min(5, Math.round(intent)))
    const filled = '★'.repeat(score)
    const empty = '☆'.repeat(5 - score)
    return new Handlebars.SafeString(`<span class="stars">${filled}${empty}</span>`)
  })

  Handlebars.registerHelper('sentimentLabel', function (sentiment: string): string {
    const map: Record<string, string> = {
      positive: 'Positivo',
      neutral: 'Neutral',
      negative: 'Negativo',
    }
    return map[sentiment] ?? sentiment
  })

  Handlebars.registerHelper('truncate', function (text: string, maxLength: number): string {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trimEnd() + '…'
  })

  // Math helpers for SVG charts
  Handlebars.registerHelper('add', function (a: number, b: number): number {
    return Number(a) + Number(b)
  })

  Handlebars.registerHelper('subtract', function (a: number, b: number): number {
    return Number(a) - Number(b)
  })

  Handlebars.registerHelper('multiply', function (a: number, b: number): number {
    return Number(a) * Number(b)
  })

  Handlebars.registerHelper('divide', function (a: number, b: number): number {
    return Number(a) / Number(b)
  })

  Handlebars.registerHelper('greaterThan', function (a: number, b: number): boolean {
    return Number(a) > Number(b)
  })

  Handlebars.registerHelper('ifThen', function (condition: boolean, a: unknown, b: unknown): unknown {
    return condition ? a : b
  })

  Handlebars.registerHelper('array', function (...args: unknown[]): unknown[] {
    args.pop() // remove options object
    return args
  })

  Handlebars.registerHelper('obj', function (...args: unknown[]): Record<string, unknown> {
    args.pop() // remove options object
    const obj: Record<string, unknown> = {}
    for (let i = 0; i < args.length; i += 2) {
      obj[String(args[i])] = args[i + 1]
    }
    return obj
  })

  Handlebars.registerHelper('setVar', function (name: string, value: unknown, options: Handlebars.HelperOptions): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(options.data?.root as any)[name] = value
    return ''
  })

  Handlebars.registerHelper('cosine', function (degrees: number): number {
    return Math.cos((degrees * Math.PI) / 180)
  })

  Handlebars.registerHelper('sine', function (degrees: number): number {
    return Math.sin((degrees * Math.PI) / 180)
  })

  Handlebars.registerHelper('stripMarkdown', function (text: string): Handlebars.SafeString {
    if (!text) return new Handlebars.SafeString('')
    const clean = String(text)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/^Executive Summary:\s*/im, '')
      .replace(/^Resumen Ejecutivo:\s*/im, '')
      .trim()
    return new Handlebars.SafeString(clean)
  })

  Handlebars.registerHelper('cleanQuote', function (text: string, maxLength: number): Handlebars.SafeString {
    if (!text) return new Handlebars.SafeString('')
    let clean = String(text)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      // Strip numbered questions the LLM re-includes in its response (e.g. "1. ¿Te interesaría...")
      .replace(/^\d+\.\s+¿[^?]+\?[^?]*\??\s*/gm, '')
      // Strip plain "1." list item prefixes
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    // If text still starts with a question, skip to the first answer-like sentence
    if (clean.startsWith('¿') || /^\d/.test(clean)) {
      const afterQuestion = clean.replace(/^[^.!]+[.!]\s*/, '')
      if (afterQuestion.length > 50) clean = afterQuestion
    }
    const truncated = clean.length > maxLength ? clean.slice(0, maxLength).trimEnd() + '…' : clean
    return new Handlebars.SafeString(truncated)
  })

  Handlebars.registerHelper('absValue', function (n: number): number {
    return Math.abs(Number(n))
  })
}
