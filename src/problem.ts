import type { ProblemDetails } from './types.js'
import { HTTP_STATUS_TITLES, HTTP_STATUS_TYPE_SLUGS, isValidProblemStatus } from './errors.js'

/**
 * Options for ProblemDocument constructor
 */
export interface ProblemDocumentOptions {
  status: number
  title?: string
  type?: string
  detail?: string
  instance?: string
  extensions?: Record<string, unknown>
}

/**
 * Class for building RFC 9457 Problem Details documents
 */
export class ProblemDocument implements ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string;
  [key: string]: unknown

  constructor(options: ProblemDocumentOptions) {
    if (!isValidProblemStatus(options.status)) {
      throw new Error(`Invalid status code: ${options.status}. Must be 4xx or 5xx.`)
    }

    this.status = options.status
    this.title = options.title || HTTP_STATUS_TITLES[options.status] || 'Unknown Error'
    this.type = options.type || 'about:blank'

    if (options.detail !== undefined) {
      this.detail = options.detail
    }

    if (options.instance !== undefined) {
      this.instance = options.instance
    }

    // Add extension fields
    if (options.extensions) {
      for (const [key, value] of Object.entries(options.extensions)) {
        if (!['type', 'title', 'status', 'detail', 'instance'].includes(key)) {
          this[key] = value
        }
      }
    }
  }

  /**
   * Serialize to JSON with correct property order
   * Order: type, title, status, detail, instance, ...extensions
   */
  toJSON(): ProblemDetails {
    const ordered: ProblemDetails = {
      type: this.type,
      title: this.title,
      status: this.status
    }

    if (this.detail !== undefined) {
      ordered.detail = this.detail
    }

    if (this.instance !== undefined) {
      ordered.instance = this.instance
    }

    // Add extensions in original order
    for (const [key, value] of Object.entries(this)) {
      if (!['type', 'title', 'status', 'detail', 'instance'].includes(key) && value !== undefined) {
        ordered[key] = value
      }
    }

    return ordered
  }

  /**
   * Serialize to XML according to RFC 9457
   */
  toXML(): string {
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    const valueToXml = (key: string, value: unknown): string => {
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.map(v => valueToXml(key, v)).join('')
        }
        const nested = Object.entries(value as Record<string, unknown>)
          .map(([k, v]) => valueToXml(k, v))
          .join('')
        return `<${key}>${nested}</${key}>`
      }
      return `<${key}>${escapeXml(String(value))}</${key}>`
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<problem xmlns="urn:ietf:rfc:9457">\n'
    xml += `  <type>${escapeXml(this.type)}</type>\n`
    xml += `  <title>${escapeXml(this.title)}</title>\n`
    xml += `  <status>${this.status}</status>\n`

    if (this.detail !== undefined) {
      xml += `  <detail>${escapeXml(this.detail)}</detail>\n`
    }

    if (this.instance !== undefined) {
      xml += `  <instance>${escapeXml(this.instance)}</instance>\n`
    }

    // Add extensions
    for (const [key, value] of Object.entries(this)) {
      if (!['type', 'title', 'status', 'detail', 'instance'].includes(key) && value !== undefined) {
        xml += `  ${valueToXml(key, value)}\n`
      }
    }

    xml += '</problem>'
    return xml
  }

  // Factory methods for common HTTP errors

  static badRequest(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 400, detail, extensions })
  }

  static unauthorized(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 401, detail, extensions })
  }

  static paymentRequired(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 402, detail, extensions })
  }

  static forbidden(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 403, detail, extensions })
  }

  static notFound(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 404, detail, extensions })
  }

  static methodNotAllowed(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 405, detail, extensions })
  }

  static notAcceptable(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 406, detail, extensions })
  }

  static conflict(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 409, detail, extensions })
  }

  static gone(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 410, detail, extensions })
  }

  static unprocessableEntity(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 422, detail, extensions })
  }

  static tooManyRequests(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 429, detail, extensions })
  }

  static internalServerError(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 500, detail, extensions })
  }

  static notImplemented(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 501, detail, extensions })
  }

  static badGateway(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 502, detail, extensions })
  }

  static serviceUnavailable(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 503, detail, extensions })
  }

  static gatewayTimeout(detail?: string, extensions?: Record<string, unknown>): ProblemDocument {
    return new ProblemDocument({ status: 504, detail, extensions })
  }
}
