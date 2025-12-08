import type { FastifyInstance, FastifyReply, FastifyRequest, FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import type { ProblemDetails, ProblemOptions, FastifyProblemDetailsOptions, ProblemTypeConfig } from './types.js'
import { ProblemDocument } from './problem.js'
import { getStatusTitle, getTypeSlug, isValidProblemStatus } from './errors.js'
import { negotiateContentType, serialize, CONTENT_TYPES } from './serializer.js'

/**
 * Default plugin options
 */
const DEFAULT_OPTIONS: Required<Omit<FastifyProblemDetailsOptions, 'baseUrl' | 'titleMap' | 'typeMap' | 'onProblem'>> = {
  includeStackTrace: process.env.NODE_ENV !== 'production',
  defaultLanguage: 'en',
  supportXml: false,
  convertFastifyErrors: true,
  sanitizeProduction: true
}

/**
 * Check if running in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Build type URI from status code and options
 */
function buildTypeUri(status: number, options: FastifyProblemDetailsOptions): string {
  const slug = options.typeMap?.[status] || getTypeSlug(status)

  if (options.baseUrl) {
    return `${options.baseUrl}/${slug}`
  }

  return 'about:blank'
}

/**
 * Get title for status code
 */
function getTitle(status: number, options: FastifyProblemDetailsOptions): string {
  return options.titleMap?.[status] || getStatusTitle(status, options.defaultLanguage)
}

/**
 * Create ProblemDetails from options
 */
function createProblemDetails(
  status: number,
  problemOptions: ProblemOptions | undefined,
  pluginOptions: FastifyProblemDetailsOptions,
  request: FastifyRequest
): ProblemDetails {
  const type = (problemOptions?.type as string | undefined) || buildTypeUri(status, pluginOptions)
  const title = (problemOptions?.title as string | undefined) || getTitle(status, pluginOptions)

  const problem: ProblemDetails = {
    type,
    title,
    status
  }

  if (problemOptions?.detail !== undefined) {
    problem.detail = problemOptions.detail as string
  }

  if (problemOptions?.instance !== undefined) {
    problem.instance = problemOptions.instance as string
  } else {
    problem.instance = request.url
  }

  // Add extension fields
  if (problemOptions) {
    for (const [key, value] of Object.entries(problemOptions)) {
      if (!['type', 'title', 'detail', 'instance', 'cause'].includes(key) && value !== undefined) {
        problem[key] = value
      }
    }
  }

  // Add stack trace in development
  if (pluginOptions.includeStackTrace && problemOptions?.cause?.stack) {
    problem.stack = problemOptions.cause.stack
  }

  return problem
}

/**
 * Convert FastifyError to ProblemDetails
 */
function fastifyErrorToProblem(
  error: FastifyError | Error,
  options: FastifyProblemDetailsOptions,
  request: FastifyRequest
): ProblemDetails {
  const statusCode = (error as FastifyError).statusCode || 500
  const isServerErr = statusCode >= 500

  const problem: ProblemDetails = {
    type: buildTypeUri(statusCode, options),
    title: getTitle(statusCode, options),
    status: statusCode,
    instance: request.url
  }

  // Sanitize error details in production for 5xx errors
  if (isProduction() && options.sanitizeProduction && isServerErr) {
    problem.detail = 'An unexpected error occurred'
  } else {
    problem.detail = error.message
  }

  // Add validation errors if present
  const fastifyError = error as FastifyError
  if (fastifyError.validation && Array.isArray(fastifyError.validation)) {
    problem.errors = fastifyError.validation.map(v => ({
      field: v.instancePath || v.schemaPath,
      message: v.message || 'Validation failed',
      keyword: v.keyword
    }))
  }

  // Add stack trace in development
  if (options.includeStackTrace && !isProduction() && error.stack) {
    problem.stack = error.stack
  }

  // Add error code if present
  if (fastifyError.code) {
    problem.code = fastifyError.code
  }

  return problem
}

/**
 * Send problem response
 */
async function sendProblem(
  reply: FastifyReply,
  problem: ProblemDetails,
  options: FastifyProblemDetailsOptions,
  request: FastifyRequest
): Promise<void> {
  // Call onProblem hook if defined
  if (options.onProblem) {
    await options.onProblem(problem, request)
  }

  // Determine response format
  const format = negotiateContentType(
    request.headers.accept,
    options.supportXml || false
  )

  const { content, contentType } = serialize(problem, format)

  reply
    .code(problem.status || 500)
    .header('Content-Type', contentType)
    .send(content)
}

/**
 * Create reply decorator for specific status code
 */
function createReplyDecorator(
  status: number,
  pluginOptions: FastifyProblemDetailsOptions
) {
  return function (this: FastifyReply, options?: ProblemOptions): FastifyReply {
    const request = this.request
    const problem = createProblemDetails(status, options, pluginOptions, request)
    sendProblem(this, problem, pluginOptions, request)
    return this
  }
}

/**
 * Fastify Problem Details Plugin
 */
async function fastifyProblemDetailsPlugin(
  fastify: FastifyInstance,
  opts: FastifyProblemDetailsOptions
): Promise<void> {
  const options: FastifyProblemDetailsOptions = {
    ...DEFAULT_OPTIONS,
    ...opts
  }

  // Store for custom problem types
  const problemTypes = new Map<string, { status: number; title: string; type: string }>()

  // Decorate fastify instance
  fastify.decorate('problemTypes', problemTypes)

  fastify.decorate('registerProblemType', function (name: string, config: ProblemTypeConfig) {
    const type = config.type || (options.baseUrl ? `${options.baseUrl}/${name}` : `about:blank`)
    problemTypes.set(name, {
      status: config.status,
      title: config.title,
      type
    })
  })

  // Decorate reply with problem method
  fastify.decorateReply('problem', function (this: FastifyReply, statusCode: number, problemOpts?: ProblemOptions): FastifyReply {
    if (!isValidProblemStatus(statusCode)) {
      throw new Error(`Invalid status code: ${statusCode}. Must be 4xx or 5xx.`)
    }

    const request = this.request

    // Check if type refers to a registered problem type
    let finalOptions = problemOpts
    const typeStr = problemOpts?.type as string | undefined
    if (typeStr && problemTypes.has(typeStr)) {
      const registered = problemTypes.get(typeStr)!
      finalOptions = {
        ...problemOpts,
        type: registered.type,
        title: (problemOpts?.title as string | undefined) || registered.title
      }
    }

    const problem = createProblemDetails(statusCode, finalOptions, options, request)
    sendProblem(this, problem, options, request)
    return this
  })

  // Decorate reply with createProblem method
  fastify.decorateReply('createProblem', function (this: FastifyReply, statusCode: number, problemOpts?: ProblemOptions): ProblemDetails {
    if (!isValidProblemStatus(statusCode)) {
      throw new Error(`Invalid status code: ${statusCode}. Must be 4xx or 5xx.`)
    }
    return createProblemDetails(statusCode, problemOpts, options, this.request)
  })

  // Add shortcut methods for common HTTP errors
  const errorMethods: Array<[string, number]> = [
    ['badRequest', 400],
    ['unauthorized', 401],
    ['paymentRequired', 402],
    ['forbidden', 403],
    ['notFound', 404],
    ['methodNotAllowed', 405],
    ['notAcceptable', 406],
    ['conflict', 409],
    ['gone', 410],
    ['unprocessableEntity', 422],
    ['tooManyRequests', 429],
    ['internalServerError', 500],
    ['notImplemented', 501],
    ['badGateway', 502],
    ['serviceUnavailable', 503],
    ['gatewayTimeout', 504]
  ]

  for (const [method, status] of errorMethods) {
    fastify.decorateReply(method, createReplyDecorator(status, options))
  }

  // Set error handler to convert errors to Problem Details
  if (options.convertFastifyErrors) {
    fastify.setErrorHandler(async (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const problem = fastifyErrorToProblem(error, options, request)
      await sendProblem(reply, problem, options, request)
    })
  }
}

/**
 * Export plugin wrapped with fastify-plugin
 */
export default fp(fastifyProblemDetailsPlugin, {
  fastify: '5.x',
  name: 'fastify-problem-details'
})

export { fastifyProblemDetailsPlugin }
