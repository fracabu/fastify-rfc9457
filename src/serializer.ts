import type { ProblemDetails } from './types.js'

/**
 * Standard RFC 9457 fields in order
 */
const STANDARD_FIELDS = ['type', 'title', 'status', 'detail', 'instance'] as const

/**
 * Serialize ProblemDetails to JSON with correct property order
 * Order: type, title, status, detail, instance, ...extensions
 */
export function serializeToJSON(problem: ProblemDetails): string {
  const ordered: Record<string, unknown> = {}

  // Standard properties in RFC order
  if (problem.type !== undefined) ordered.type = problem.type
  if (problem.title !== undefined) ordered.title = problem.title
  if (problem.status !== undefined) ordered.status = problem.status
  if (problem.detail !== undefined) ordered.detail = problem.detail
  if (problem.instance !== undefined) ordered.instance = problem.instance

  // Extensions after standard fields
  for (const [key, value] of Object.entries(problem)) {
    if (!STANDARD_FIELDS.includes(key as typeof STANDARD_FIELDS[number]) && value !== undefined) {
      ordered[key] = value
    }
  }

  return JSON.stringify(ordered)
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert a value to XML element(s)
 */
function valueToXml(key: string, value: unknown, indent: string = '  '): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(v => valueToXml(key, v, indent)).join('\n')
    }
    const nested = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => valueToXml(k, v, indent + '  '))
      .filter(Boolean)
      .join('\n')
    return `${indent}<${key}>\n${nested}\n${indent}</${key}>`
  }

  return `${indent}<${key}>${escapeXml(String(value))}</${key}>`
}

/**
 * Serialize ProblemDetails to XML according to RFC 9457
 */
export function serializeToXML(problem: ProblemDetails): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<problem xmlns="urn:ietf:rfc:9457">\n'

  // Standard fields in order
  if (problem.type !== undefined) {
    xml += `  <type>${escapeXml(String(problem.type))}</type>\n`
  }
  if (problem.title !== undefined) {
    xml += `  <title>${escapeXml(String(problem.title))}</title>\n`
  }
  if (problem.status !== undefined) {
    xml += `  <status>${problem.status}</status>\n`
  }
  if (problem.detail !== undefined) {
    xml += `  <detail>${escapeXml(String(problem.detail))}</detail>\n`
  }
  if (problem.instance !== undefined) {
    xml += `  <instance>${escapeXml(String(problem.instance))}</instance>\n`
  }

  // Extension fields
  for (const [key, value] of Object.entries(problem)) {
    if (!STANDARD_FIELDS.includes(key as typeof STANDARD_FIELDS[number]) && value !== undefined) {
      xml += valueToXml(key, value) + '\n'
    }
  }

  xml += '</problem>'
  return xml
}

/**
 * Parse Accept header and extract media types with quality values
 */
function parseAcceptHeader(accept: string): Array<{ type: string; quality: number }> {
  return accept
    .split(',')
    .map(part => {
      const [type, ...params] = part.trim().split(';')
      let quality = 1

      for (const param of params) {
        const [key, value] = param.trim().split('=')
        if (key === 'q' && value) {
          quality = parseFloat(value)
        }
      }

      return { type: type.trim(), quality }
    })
    .sort((a, b) => b.quality - a.quality)
}

/**
 * Content types for Problem Details
 */
export const CONTENT_TYPES = {
  JSON: 'application/problem+json',
  XML: 'application/problem+xml'
} as const

/**
 * Determine output format based on Accept header
 */
export function negotiateContentType(
  acceptHeader: string | undefined,
  supportXml: boolean
): 'json' | 'xml' {
  if (!acceptHeader || !supportXml) {
    return 'json'
  }

  const accepts = parseAcceptHeader(acceptHeader)

  for (const { type } of accepts) {
    if (type === 'application/problem+xml' || type === 'application/xml') {
      return 'xml'
    }
    if (type === 'application/problem+json' || type === 'application/json' || type === '*/*') {
      return 'json'
    }
  }

  return 'json'
}

/**
 * Serialize problem to appropriate format
 */
export function serialize(
  problem: ProblemDetails,
  format: 'json' | 'xml'
): { content: string; contentType: string } {
  if (format === 'xml') {
    return {
      content: serializeToXML(problem),
      contentType: CONTENT_TYPES.XML
    }
  }

  return {
    content: serializeToJSON(problem),
    contentType: CONTENT_TYPES.JSON
  }
}
