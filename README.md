# fastify-problem-details

[![npm version](https://img.shields.io/npm/v/fastify-problem-details.svg)](https://www.npmjs.com/package/fastify-problem-details)
[![license](https://img.shields.io/npm/l/fastify-problem-details.svg)](LICENSE)

RFC 7807/9457 Problem Details for HTTP APIs - Standardized error responses for Fastify.

## Features

- Full RFC 9457 (Problem Details) compliance
- TypeScript support with complete type definitions
- Zero runtime dependencies (only `fastify-plugin`)
- Automatic error conversion from Fastify errors
- Custom problem types registration
- Multiple language support (EN, IT, ES, DE, FR)
- Optional XML format support
- Production-safe error sanitization

## Install

```bash
npm install fastify-problem-details
```

## Quick Start

```typescript
import Fastify from 'fastify'
import problemDetails from 'fastify-problem-details'

const fastify = Fastify()

await fastify.register(problemDetails, {
  baseUrl: 'https://api.example.com/errors'
})

fastify.get('/users/:id', async (request, reply) => {
  const user = await findUser(request.params.id)

  if (!user) {
    return reply.notFound({
      detail: `User ${request.params.id} not found`
    })
  }

  return user
})
```

Response:

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User 123 not found",
  "instance": "/users/123"
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | - | Base URL for error type URIs |
| `includeStackTrace` | `boolean` | `false` in prod | Include stack traces in responses |
| `defaultLanguage` | `string` | `'en'` | Default language for titles |
| `titleMap` | `Record<number, string>` | - | Custom status code titles |
| `typeMap` | `Record<number, string>` | - | Custom type URI slugs |
| `onProblem` | `function` | - | Hook called before sending |
| `supportXml` | `boolean` | `false` | Enable XML format support |
| `convertFastifyErrors` | `boolean` | `true` | Auto-convert Fastify errors |
| `sanitizeProduction` | `boolean` | `true` | Hide internal details in prod |

## Reply Methods

### Shortcut methods

```typescript
reply.badRequest(options?)       // 400
reply.unauthorized(options?)     // 401
reply.paymentRequired(options?)  // 402
reply.forbidden(options?)        // 403
reply.notFound(options?)         // 404
reply.methodNotAllowed(options?) // 405
reply.notAcceptable(options?)    // 406
reply.conflict(options?)         // 409
reply.gone(options?)             // 410
reply.unprocessableEntity(options?) // 422
reply.tooManyRequests(options?)  // 429
reply.internalServerError(options?) // 500
reply.notImplemented(options?)   // 501
reply.badGateway(options?)       // 502
reply.serviceUnavailable(options?) // 503
reply.gatewayTimeout(options?)   // 504
```

### Generic method

```typescript
reply.problem(statusCode, options?)
```

### Options

```typescript
interface ProblemOptions {
  type?: string      // Problem type URI or registered type name
  title?: string     // Override default title
  detail?: string    // Human-readable explanation
  instance?: string  // URI of the specific occurrence
  cause?: Error      // Original error (for logging)
  [key: string]: unknown  // Custom extension fields
}
```

## Extension Fields

Add custom fields to provide more context:

```typescript
fastify.post('/transfer', async (request, reply) => {
  const { amount } = request.body
  const balance = await getBalance(request.user.id)

  if (balance < amount) {
    return reply.problem(403, {
      type: 'insufficient-funds',
      detail: `Your balance is €${balance}, but the transfer requires €${amount}`,
      balance,
      required: amount,
      accounts: ['/account/123', '/account/456']
    })
  }
})
```

Response:

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Forbidden",
  "status": 403,
  "detail": "Your balance is €30, but the transfer requires €50",
  "instance": "/transfer",
  "balance": 30,
  "required": 50,
  "accounts": ["/account/123", "/account/456"]
}
```

## Custom Problem Types

Register reusable problem types:

```typescript
fastify.registerProblemType('insufficient-funds', {
  status: 403,
  title: 'Insufficient Funds',
  type: 'https://api.example.com/errors/insufficient-funds'
})

// Use it
reply.problem(403, {
  type: 'insufficient-funds',  // References registered type
  detail: 'Not enough balance'
})
```

## Error Handler Integration

The plugin automatically converts thrown errors to Problem Details:

```typescript
fastify.get('/data', async () => {
  throw new Error('Database connection failed')
})
// Returns 500 with Problem Details format

// Errors with statusCode are preserved
const error = new Error('Not found')
error.statusCode = 404
throw error
// Returns 404 with Problem Details format
```

Validation errors include field details:

```json
{
  "type": "https://api.example.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "body/email must match format \"email\"",
  "instance": "/users",
  "errors": [
    {
      "field": "/email",
      "message": "must match format \"email\"",
      "keyword": "format"
    }
  ]
}
```

## onProblem Hook

Log or monitor all problem responses:

```typescript
await fastify.register(problemDetails, {
  onProblem: (problem, request) => {
    request.log.error({ problem }, 'Problem Details response')
    metrics.increment('api.errors', { status: problem.status })
  }
})
```

## XML Support

Enable XML format for clients that prefer it:

```typescript
await fastify.register(problemDetails, {
  supportXml: true
})
```

Request with `Accept: application/problem+xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<problem xmlns="urn:ietf:rfc:9457">
  <type>https://api.example.com/errors/not-found</type>
  <title>Not Found</title>
  <status>404</status>
  <detail>User not found</detail>
  <instance>/users/123</instance>
</problem>
```

## ProblemDocument Class

Use the `ProblemDocument` class directly:

```typescript
import { ProblemDocument } from 'fastify-problem-details'

const problem = new ProblemDocument({
  status: 404,
  title: 'Not Found',
  detail: 'Resource not found',
  extensions: { resourceId: 123 }
})

// Factory methods
const notFound = ProblemDocument.notFound('User not found')
const badRequest = ProblemDocument.badRequest('Invalid input', { field: 'email' })

// Serialization
problem.toJSON()  // RFC-compliant JSON object
problem.toXML()   // XML string
```

## TypeScript

Full TypeScript support with module augmentation:

```typescript
import type { ProblemDetails, ProblemOptions } from 'fastify-problem-details'

// reply.notFound, reply.problem, etc. are fully typed
fastify.get('/users/:id', async (request, reply) => {
  return reply.notFound({
    detail: 'User not found',
    userId: request.params.id  // Extension field
  })
})
```

## Requirements

- Node.js >= 20.0.0
- Fastify >= 5.0.0

## License

MIT
