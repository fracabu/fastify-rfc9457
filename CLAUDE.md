# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**fastify-rfc9457** - A Fastify plugin implementing RFC 7807/9457 Problem Details for HTTP APIs. It provides standardized error responses with the `application/problem+json` content type.

## Build & Development Commands

```bash
npm run build        # Build with tsup (ESM only)
npm run dev          # Build with watch mode
npm test             # Run tests with tap
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## Architecture

### Source Files (src/)

- **index.ts**: Public exports entry point
- **plugin.ts**: Main Fastify plugin implementation using `fastify-plugin`
- **types.ts**: TypeScript interfaces (`ProblemDetails`, `ProblemOptions`, `FastifyProblemDetailsOptions`)
- **problem.ts**: `ProblemDocument` class with factory methods for common HTTP errors
- **errors.ts**: HTTP status code constants, titles, type slugs, and translations
- **serializer.ts**: JSON/XML serialization with RFC-compliant property ordering

### Key Interfaces

- `ProblemDetails`: RFC 9457 standard fields (type, title, status, detail, instance) + extensions
- `FastifyProblemDetailsOptions`: Plugin configuration (baseUrl, includeStackTrace, defaultLanguage, titleMap, typeMap, onProblem hook, supportXml, sanitizeProduction)
- `ProblemReplies`: Reply decorator methods (badRequest, unauthorized, forbidden, notFound, conflict, etc.)

### Plugin Behavior

1. Decorates `FastifyReply` with `reply.problem(status, options)` and shortcut methods (`reply.notFound()`, etc.)
2. Decorates `FastifyInstance` with `registerProblemType()` for custom error types
3. Sets error handler to convert all errors (including Fastify validation errors) to Problem Details format
4. Sets `Content-Type: application/problem+json` on error responses
5. Sanitizes error details in production (no stack traces, generic messages for 5xx)

### RFC Compliance

- Property order: type, title, status, detail, instance, then extensions
- Default type: `about:blank` when not specified
- Supports custom extensions (any additional properties)
- Optional XML format (`application/problem+xml`)

## Implementation Constraints

- ESM-only (`"type": "module"`)
- Fastify v5 peer dependency
- Zero runtime dependencies (only `fastify-plugin`)
- Node.js >= 20.0.0
- Status codes must be 4xx or 5xx
