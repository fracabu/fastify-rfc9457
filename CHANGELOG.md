# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-08

### Added

- Initial release
- Full RFC 9457 (Problem Details) compliance
- Reply decorators: `notFound()`, `badRequest()`, `unauthorized()`, `forbidden()`, `conflict()`, `unprocessableEntity()`, `tooManyRequests()`, `internalServerError()`, `serviceUnavailable()`, and more
- Generic `reply.problem(status, options)` method
- `reply.createProblem()` to create without sending
- Custom problem types registration via `fastify.registerProblemType()`
- Automatic conversion of Fastify errors to Problem Details format
- Validation errors with field-level details
- Multiple language support (EN, IT, ES, DE, FR)
- Optional XML format support (`application/problem+xml`)
- `onProblem` hook for logging/monitoring
- Production-safe error sanitization
- TypeScript support with complete type definitions
- Zero runtime dependencies (only `fastify-plugin`)

### Requirements

- Node.js >= 20.0.0
- Fastify >= 5.0.0
