// Main plugin export
export { default, fastifyProblemDetailsPlugin } from './plugin.js'

// Types
export type {
  ProblemDetails,
  ProblemOptions,
  FastifyProblemDetailsOptions,
  ProblemReplies,
  ProblemTypeConfig
} from './types.js'

// ProblemDocument class
export { ProblemDocument } from './problem.js'
export type { ProblemDocumentOptions } from './problem.js'

// Error utilities
export {
  HTTP_STATUS_TITLES,
  HTTP_STATUS_TYPE_SLUGS,
  HTTP_STATUS_TITLES_IT,
  HTTP_STATUS_TITLES_ES,
  HTTP_STATUS_TITLES_DE,
  HTTP_STATUS_TITLES_FR,
  TRANSLATIONS,
  getStatusTitle,
  getTypeSlug,
  isClientError,
  isServerError,
  isValidProblemStatus
} from './errors.js'

// Serialization utilities
export {
  serializeToJSON,
  serializeToXML,
  negotiateContentType,
  serialize,
  CONTENT_TYPES
} from './serializer.js'
