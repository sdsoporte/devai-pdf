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

  Handlebars.registerHelper('intentStars', function (intent: number): string {
    const score = Math.max(1, Math.min(5, Math.round(intent)))
    const filled = '★'.repeat(score)
    const empty = '☆'.repeat(5 - score)
    return `<span class="stars">${filled}${empty}</span>`
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
}
