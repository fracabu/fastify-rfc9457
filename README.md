<h1 align="center">fastify-rfc9457</h1>
<h3 align="center">RFC 7807/9457 Problem Details for HTTP APIs</h3>

<p align="center">
  <em>Standardized error responses for Fastify</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fastify-rfc9457"><img src="https://img.shields.io/npm/v/fastify-rfc9457.svg" alt="npm version" /></a>
  <img src="https://github.com/fracabu/fastify-rfc9457/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://img.shields.io/badge/Fastify-5.x-000000?style=flat-square&logo=fastify" alt="Fastify" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript" />
</p>

<p align="center">
  :gb: <a href="#english">English</a> | :it: <a href="#italiano">Italiano</a>
</p>

---

## Overview

<!-- ![fastify-rfc9457 Overview](assets/rfc9457-overview.png) -->

---

<a name="english"></a>
## :gb: English

### Features

- Full RFC 9457 compliance
- TypeScript support with complete type definitions
- Zero runtime dependencies
- Automatic error conversion from Fastify errors
- Custom problem types registration
- Multiple language support (EN, IT, ES, DE, FR)
- Optional XML format support
- Production-safe error sanitization

### Install

```bash
npm install fastify-rfc9457
```

### Quick Start

```typescript
import Fastify from 'fastify'
import problemDetails from 'fastify-rfc9457'

const fastify = Fastify()

await fastify.register(problemDetails, {
  baseUrl: 'https://api.example.com/errors'
})

fastify.get('/users/:id', async (request, reply) => {
  const user = await findUser(request.params.id)
  if (!user) {
    return reply.notFound({ detail: `User ${request.params.id} not found` })
  }
  return user
})
```

### Response Example

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User 123 not found",
  "instance": "/users/123"
}
```

### Reply Methods

```typescript
reply.badRequest()       // 400
reply.unauthorized()     // 401
reply.forbidden()        // 403
reply.notFound()         // 404
reply.conflict()         // 409
reply.internalServerError() // 500
// ... and more
```

---

<a name="italiano"></a>
## :it: Italiano

### Funzionalita

- Piena conformita RFC 9457
- Supporto TypeScript con definizioni complete
- Zero dipendenze runtime
- Conversione automatica errori Fastify
- Registrazione tipi problema personalizzati
- Supporto multilingue (EN, IT, ES, DE, FR)
- Supporto opzionale formato XML
- Sanificazione errori sicura per produzione

### Installazione

```bash
npm install fastify-rfc9457
```

### Quick Start

```typescript
import Fastify from 'fastify'
import problemDetails from 'fastify-rfc9457'

const fastify = Fastify()

await fastify.register(problemDetails, {
  baseUrl: 'https://api.example.com/errors'
})

fastify.get('/users/:id', async (request, reply) => {
  const user = await findUser(request.params.id)
  if (!user) {
    return reply.notFound({ detail: `Utente ${request.params.id} non trovato` })
  }
  return user
})
```

### Campi Estensione

```typescript
return reply.problem(403, {
  type: 'insufficient-funds',
  detail: 'Saldo insufficiente',
  balance: 30,
  required: 50
})
```

---

## Requirements

- Node.js >= 20.0.0
- Fastify >= 5.0.0

## License

MIT

---

<p align="center">
  <a href="https://github.com/fracabu">
    <img src="https://img.shields.io/badge/Made_by-fracabu-8B5CF6?style=flat-square" alt="Made by fracabu" />
  </a>
</p>
