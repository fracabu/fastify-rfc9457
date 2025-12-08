# Specifiche: fastify-problem-details

Plugin Fastify per la gestione standardizzata degli errori HTTP secondo RFC 7807/9457 (Problem Details for HTTP APIs).

---

## 1. Metadata Progetto

```yaml
name: fastify-problem-details
version: 1.0.0
description: RFC 7807/9457 Problem Details for HTTP APIs - Standardized error responses for Fastify
license: MIT
author: fracabu
keywords:
  - fastify
  - fastify-plugin
  - error-handling
  - rfc7807
  - rfc9457
  - problem-details
  - api-errors
  - http-errors
  - rest-api
  - error-response
engines:
  node: ">=20.0.0"
type: module
```

---

## 2. Background: RFC 7807/9457

### 2.1 Cos'è Problem Details?

RFC 7807 (aggiornato da RFC 9457) definisce un formato standard per rappresentare errori nelle HTTP API. Questo standard è adottato da:
- **Microsoft** (Azure APIs)
- **Google** (Cloud APIs)  
- **Stripe** (Payment APIs)
- **Zalando** (RESTful API Guidelines)

### 2.2 Struttura Problem Details

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 403,
  "detail": "Your account balance is €30, but the transfer requires €50.",
  "instance": "/transfers/12345",
  "balance": 30,
  "required": 50
}
```

### 2.3 Campi Standard

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `type` | URI | No* | URI che identifica il tipo di problema |
| `title` | string | No | Breve descrizione human-readable |
| `status` | integer | No | HTTP status code |
| `detail` | string | No | Spiegazione specifica dell'occorrenza |
| `instance` | URI | No | URI che identifica l'occorrenza specifica |

*Se omesso, assume il valore `about:blank`

### 2.4 Content-Type

```
Content-Type: application/problem+json
```

Per XML (opzionale):
```
Content-Type: application/problem+xml
```

---

## 3. Struttura Directory

```
fastify-problem-details/
├── src/
│   ├── index.ts              # Entry point, export plugin
│   ├── plugin.ts             # Implementazione plugin
│   ├── types.ts              # TypeScript types/interfaces
│   ├── problem.ts            # Classe ProblemDocument
│   ├── errors.ts             # Errori predefiniti HTTP
│   ├── serializer.ts         # Serializzazione JSON/XML
│   └── utils.ts              # Utility functions
├── test/
│   ├── plugin.test.ts        # Test plugin integration
│   ├── problem.test.ts       # Test ProblemDocument
│   ├── errors.test.ts        # Test errori predefiniti
│   └── helpers.ts            # Test utilities
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .npmignore
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 4. Dipendenze

```json
{
  "dependencies": {
    "fastify-plugin": "^5.0.0"
  },
  "devDependencies": {
    "fastify": "^5.0.0",
    "typescript": "^5.7.0",
    "tsup": "^8.3.0",
    "@types/node": "^22.0.0",
    "tap": "^21.0.0"
  },
  "peerDependencies": {
    "fastify": "^5.0.0"
  }
}
```

**Note**: Zero dipendenze runtime oltre `fastify-plugin`. La serializzazione XML è opzionale e implementata internamente.

---

## 5. TypeScript Types (src/types.ts)

```typescript
import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify'

/**
 * Campi standard RFC 9457
 */
export interface ProblemDetails {
  /**
   * URI reference che identifica il tipo di problema.
   * Quando dereferenziato, dovrebbe fornire documentazione human-readable.
   * @default "about:blank"
   */
  type?: string

  /**
   * Breve sommario human-readable del tipo di problema.
   * NON DEVE cambiare tra occorrenze dello stesso tipo.
   */
  title?: string

  /**
   * HTTP status code generato dal server.
   */
  status?: number

  /**
   * Spiegazione human-readable specifica di questa occorrenza.
   * DEVE essere diversa per ogni occorrenza.
   */
  detail?: string

  /**
   * URI reference che identifica l'occorrenza specifica.
   * Può o meno fornire ulteriori informazioni se dereferenziato.
   */
  instance?: string

  /**
   * Campi estesi custom (qualsiasi proprietà aggiuntiva)
   */
  [key: string]: unknown
}

/**
 * Opzioni per la creazione di un ProblemDocument
 */
export interface ProblemOptions extends ProblemDetails {
  /**
   * Causa originale dell'errore (per logging/debug)
   */
  cause?: Error
}

/**
 * Opzioni globali del plugin
 */
export interface FastifyProblemDetailsOptions {
  /**
   * Base URL per i tipi di errore.
   * I tipi saranno costruiti come: `${baseUrl}/${errorType}`
   * @example "https://api.example.com/errors"
   */
  baseUrl?: string

  /**
   * Includi stack trace nel response (solo development)
   * @default false in production, true altrimenti
   */
  includeStackTrace?: boolean

  /**
   * Lingua default per i titoli degli errori
   * @default "en"
   */
  defaultLanguage?: 'en' | 'it' | 'es' | 'de' | 'fr'

  /**
   * Mappa custom di status code a titoli
   * @example { 404: "Risorsa non trovata" }
   */
  titleMap?: Record<number, string>

  /**
   * Mappa custom di status code a type URIs
   * @example { 404: "not-found", 403: "forbidden" }
   */
  typeMap?: Record<number, string>

  /**
   * Hook chiamato prima di inviare la risposta problem
   * Utile per logging, monitoring, etc.
   */
  onProblem?: (problem: ProblemDetails, request: FastifyRequest) => void | Promise<void>

  /**
   * Supporta Accept: application/problem+xml
   * @default false
   */
  supportXml?: boolean

  /**
   * Converti tutti gli errori Fastify in Problem Details
   * @default true
   */
  convertFastifyErrors?: boolean

  /**
   * Nascondi dettagli interni in production
   * @default true
   */
  sanitizeProduction?: boolean
}

/**
 * Errori HTTP predefiniti disponibili su reply
 */
export interface ProblemReplies {
  // 4xx Client Errors
  badRequest(options?: ProblemOptions): void
  unauthorized(options?: ProblemOptions): void
  paymentRequired(options?: ProblemOptions): void
  forbidden(options?: ProblemOptions): void
  notFound(options?: ProblemOptions): void
  methodNotAllowed(options?: ProblemOptions): void
  notAcceptable(options?: ProblemOptions): void
  conflict(options?: ProblemOptions): void
  gone(options?: ProblemOptions): void
  unprocessableEntity(options?: ProblemOptions): void
  tooManyRequests(options?: ProblemOptions): void

  // 5xx Server Errors
  internalServerError(options?: ProblemOptions): void
  notImplemented(options?: ProblemOptions): void
  badGateway(options?: ProblemOptions): void
  serviceUnavailable(options?: ProblemOptions): void
  gatewayTimeout(options?: ProblemOptions): void
}

/**
 * Estensione FastifyReply
 */
declare module 'fastify' {
  interface FastifyReply extends ProblemReplies {
    /**
     * Invia una risposta Problem Details custom
     */
    problem(statusCode: number, options?: ProblemOptions): void

    /**
     * Crea un ProblemDocument senza inviarlo
     */
    createProblem(statusCode: number, options?: ProblemOptions): ProblemDetails
  }

  interface FastifyInstance {
    /**
     * Registra un tipo di problema custom
     */
    registerProblemType(
      name: string,
      config: {
        status: number
        title: string
        type?: string
      }
    ): void

    /**
     * Mappa degli errori registrati
     */
    problemTypes: Map<string, { status: number; title: string; type: string }>
  }
}
```

---

## 6. Classe ProblemDocument (src/problem.ts)

```typescript
/**
 * Classe per costruire Problem Details documents
 */
export class ProblemDocument implements ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  [key: string]: unknown

  constructor(options: {
    status: number
    title?: string
    type?: string
    detail?: string
    instance?: string
    extensions?: Record<string, unknown>
  }) {
    // Implementazione
  }

  /**
   * Serializza in JSON
   */
  toJSON(): ProblemDetails {
    // Ordine proprietà: type, title, status, detail, instance, ...extensions
  }

  /**
   * Serializza in XML (se supportato)
   */
  toXML(): string {
    // Formato RFC 9457 XML
  }

  /**
   * Factory methods statici
   */
  static badRequest(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static unauthorized(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static forbidden(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static notFound(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static conflict(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static unprocessableEntity(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  static internalServerError(detail?: string, extensions?: Record<string, unknown>): ProblemDocument
  // ... altri status codes
}
```

---

## 7. Errori HTTP Predefiniti (src/errors.ts)

### 7.1 Titoli Standard per Status Code

```typescript
export const HTTP_STATUS_TITLES: Record<number, string> = {
  // 4xx Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Content Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Content',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',

  // 5xx Server Errors
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required'
}
```

### 7.2 Type URI Slugs

```typescript
export const HTTP_STATUS_TYPE_SLUGS: Record<number, string> = {
  400: 'bad-request',
  401: 'unauthorized',
  402: 'payment-required',
  403: 'forbidden',
  404: 'not-found',
  405: 'method-not-allowed',
  409: 'conflict',
  410: 'gone',
  422: 'unprocessable-entity',
  429: 'too-many-requests',
  500: 'internal-server-error',
  501: 'not-implemented',
  502: 'bad-gateway',
  503: 'service-unavailable',
  504: 'gateway-timeout'
}
```

### 7.3 Traduzioni (Opzionale)

```typescript
export const HTTP_STATUS_TITLES_IT: Record<number, string> = {
  400: 'Richiesta Non Valida',
  401: 'Non Autorizzato',
  403: 'Accesso Negato',
  404: 'Non Trovato',
  409: 'Conflitto',
  422: 'Entità Non Processabile',
  429: 'Troppe Richieste',
  500: 'Errore Interno del Server',
  503: 'Servizio Non Disponibile'
  // ... altri
}
```

---

## 8. Comportamento Plugin

### 8.1 Registrazione Base

```typescript
import Fastify from 'fastify'
import problemDetails from 'fastify-problem-details'

const fastify = Fastify()

// Configurazione minima
await fastify.register(problemDetails)

// Configurazione completa
await fastify.register(problemDetails, {
  baseUrl: 'https://api.example.com/errors',
  includeStackTrace: process.env.NODE_ENV !== 'production',
  defaultLanguage: 'en',
  onProblem: (problem, request) => {
    request.log.error({ problem }, 'Problem Details response')
  }
})
```

### 8.2 Uso nei Route Handler

```typescript
// Metodi shortcut
fastify.get('/users/:id', async (request, reply) => {
  const user = await findUser(request.params.id)
  
  if (!user) {
    return reply.notFound({
      detail: `User with ID ${request.params.id} was not found`,
      instance: request.url
    })
  }
  
  return user
})

// Metodo generico
fastify.post('/orders', async (request, reply) => {
  const { productId, quantity } = request.body
  const stock = await getStock(productId)
  
  if (stock < quantity) {
    return reply.problem(422, {
      detail: 'Not enough stock available',
      instance: request.url,
      // Campi estesi custom
      productId,
      requestedQuantity: quantity,
      availableStock: stock
    })
  }
  
  return createOrder(request.body)
})

// Con validazione
fastify.post('/payments', async (request, reply) => {
  const validation = validatePayment(request.body)
  
  if (!validation.valid) {
    return reply.badRequest({
      detail: 'Invalid payment data',
      instance: request.url,
      errors: validation.errors  // Array di errori di validazione
    })
  }
  
  return processPayment(request.body)
})
```

### 8.3 Registrazione Tipi Custom

```typescript
// Registra tipo di errore custom
fastify.registerProblemType('insufficient-funds', {
  status: 403,
  title: 'Insufficient Funds',
  type: 'https://api.example.com/errors/insufficient-funds'
})

// Uso
fastify.post('/transfers', async (request, reply) => {
  const balance = await getBalance(request.user.id)
  
  if (balance < request.body.amount) {
    return reply.problem(403, {
      type: 'insufficient-funds',  // Riferimento al tipo registrato
      detail: `Your balance is €${balance}, but the transfer requires €${request.body.amount}`,
      balance,
      required: request.body.amount
    })
  }
})
```

### 8.4 Error Handler Automatico

```typescript
// Il plugin sovrascrive setErrorHandler per convertire gli errori
fastify.setErrorHandler(async (error, request, reply) => {
  // Fastify errors (validation, etc.) → Problem Details
  // throw new Error() → 500 Problem Details
  // Custom errors con statusCode → Problem Details
})
```

### 8.5 Output Esempio

**Request:**
```http
GET /users/999 HTTP/1.1
Accept: application/json
```

**Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with ID 999 was not found",
  "instance": "/users/999"
}
```

---

## 9. Serializzazione (src/serializer.ts)

### 9.1 JSON Serialization

```typescript
/**
 * Serializza ProblemDetails in JSON con ordine proprietà corretto
 * Ordine: type, title, status, detail, instance, ...extensions
 */
export function serializeToJSON(problem: ProblemDetails): string {
  const ordered: ProblemDetails = {}
  
  // Proprietà standard in ordine
  if (problem.type !== undefined) ordered.type = problem.type
  if (problem.title !== undefined) ordered.title = problem.title
  if (problem.status !== undefined) ordered.status = problem.status
  if (problem.detail !== undefined) ordered.detail = problem.detail
  if (problem.instance !== undefined) ordered.instance = problem.instance
  
  // Estensioni
  for (const [key, value] of Object.entries(problem)) {
    if (!['type', 'title', 'status', 'detail', 'instance'].includes(key)) {
      ordered[key] = value
    }
  }
  
  return JSON.stringify(ordered)
}
```

### 9.2 XML Serialization (Opzionale)

```typescript
/**
 * Serializza ProblemDetails in XML secondo RFC 9457
 */
export function serializeToXML(problem: ProblemDetails): string {
  // Output esempio:
  // <?xml version="1.0" encoding="UTF-8"?>
  // <problem xmlns="urn:ietf:rfc:9457">
  //   <type>https://api.example.com/errors/not-found</type>
  //   <title>Not Found</title>
  //   <status>404</status>
  //   <detail>User not found</detail>
  //   <instance>/users/999</instance>
  // </problem>
}
```

### 9.3 Content Negotiation

```typescript
/**
 * Determina il formato di output basato su Accept header
 */
export function negotiateContentType(
  acceptHeader: string | undefined,
  supportXml: boolean
): 'json' | 'xml' {
  if (!acceptHeader || !supportXml) return 'json'
  
  // Priorità: application/problem+json > application/problem+xml > application/json
  const accepts = parseAcceptHeader(acceptHeader)
  
  if (accepts.includes('application/problem+xml')) return 'xml'
  return 'json'
}
```

---

## 10. Integrazione Error Handler

### 10.1 Conversione Errori Fastify

```typescript
/**
 * Converte FastifyError in ProblemDetails
 */
export function fastifyErrorToProblem(
  error: FastifyError,
  options: FastifyProblemDetailsOptions
): ProblemDetails {
  const problem: ProblemDetails = {
    type: buildTypeUri(error.statusCode || 500, options),
    title: getTitle(error.statusCode || 500, options),
    status: error.statusCode || 500,
    detail: error.message
  }

  // Aggiungi validation errors se presenti
  if (error.validation) {
    problem.errors = error.validation.map(v => ({
      field: v.instancePath,
      message: v.message,
      keyword: v.keyword
    }))
  }

  // Stack trace solo in development
  if (options.includeStackTrace && error.stack) {
    problem.stack = error.stack
  }

  return problem
}
```

### 10.2 Errori di Validazione

```typescript
// Input validation error → Problem Details
// Fastify validation:
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/email must match format \"email\""
}

// Convertito in:
{
  "type": "https://api.example.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": [
    {
      "field": "/email",
      "message": "must match format \"email\"",
      "keyword": "format"
    }
  ]
}
```

---

## 11. Validazione e Edge Cases

### 11.1 Validazione Input

```typescript
// Status code deve essere 4xx o 5xx
reply.problem(200, { detail: 'test' })  // ❌ Errore: status must be 4xx or 5xx

// Type deve essere URI valido o slug
reply.problem(404, { type: 'not a uri' })  // ❌ Errore: type must be URI or slug

// Status deve corrispondere alla risposta
reply.problem(404, { status: 500 })  // ⚠️ Warning: status mismatch
```

### 11.2 Sanitizzazione Production

```typescript
// In production (sanitizeProduction: true):
// - NON includere stack traces
// - NON includere dettagli interni per 5xx
// - NON esporre path filesystem

// Development:
{
  "type": "https://api.example.com/errors/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Cannot read property 'id' of undefined",
  "stack": "TypeError: Cannot read property...",
  "file": "/app/src/handlers/user.ts:42"
}

// Production:
{
  "type": "https://api.example.com/errors/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

### 11.3 Default Values

```typescript
// Se type non specificato e baseUrl non configurato
{ type: "about:blank" }

// Se title non specificato
{ title: HTTP_STATUS_TITLES[statusCode] }

// Se instance non specificato
{ instance: request.url }  // Opzionale, può essere omesso
```

---

## 12. Hook Utilizzati

```typescript
// 1. onRequest - Salva Accept header per content negotiation
fastify.addHook('onRequest', async (request) => {
  request.problemAccept = request.headers.accept
})

// 2. setErrorHandler - Converte errori in Problem Details
fastify.setErrorHandler(async (error, request, reply) => {
  const problem = convertToProblem(error, options)
  return sendProblem(reply, problem)
})

// 3. Decoratori reply - Metodi per inviare problemi
fastify.decorateReply('problem', function(status, opts) { ... })
fastify.decorateReply('notFound', function(opts) { ... })
// etc.
```

---

## 13. Test Cases Richiesti

### 13.1 Unit Tests (ProblemDocument)

```typescript
// test/problem.test.ts

// Costruzione
test('crea ProblemDocument con tutti i campi', ...)
test('crea ProblemDocument con campi minimi', ...)
test('crea ProblemDocument con estensioni custom', ...)

// Serializzazione JSON
test('serializza con ordine proprietà corretto', ...)
test('omette campi undefined', ...)
test('include estensioni dopo campi standard', ...)

// Serializzazione XML
test('serializza in XML valido', ...)
test('escape caratteri speciali XML', ...)

// Factory methods
test('ProblemDocument.notFound() crea 404', ...)
test('ProblemDocument.badRequest() crea 400', ...)

// Validazione
test('rifiuta status non 4xx/5xx', ...)
test('rifiuta type URI invalido', ...)
```

### 13.2 Integration Tests (Plugin)

```typescript
// test/plugin.test.ts

// Registrazione
test('registra plugin senza opzioni', ...)
test('registra plugin con baseUrl', ...)
test('registra plugin con titleMap custom', ...)

// Reply decorators
test('reply.notFound() invia 404 problem', ...)
test('reply.badRequest() invia 400 problem', ...)
test('reply.problem() invia problem custom', ...)
test('reply.problem() include estensioni', ...)

// Error handler
test('converte Error in 500 problem', ...)
test('converte FastifyError in problem', ...)
test('converte validation error con details', ...)
test('non converte se già problem+json', ...)

// Content-Type
test('imposta Content-Type: application/problem+json', ...)
test('supporta Accept: application/problem+xml', ...)

// Sanitizzazione
test('nasconde stack in production', ...)
test('nasconde dettagli 5xx in production', ...)
test('mostra dettagli in development', ...)

// Custom types
test('registerProblemType registra nuovo tipo', ...)
test('usa tipo registrato con reply.problem()', ...)

// onProblem hook
test('chiama onProblem prima di inviare', ...)
test('onProblem riceve problem e request', ...)
```

### 13.3 E2E Tests

```typescript
// test/e2e.test.ts

test('scenario: user not found', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/users/999'
  })
  
  expect(response.statusCode).toBe(404)
  expect(response.headers['content-type']).toContain('application/problem+json')
  
  const body = JSON.parse(response.body)
  expect(body.type).toBe('https://api.example.com/errors/not-found')
  expect(body.title).toBe('Not Found')
  expect(body.status).toBe(404)
  expect(body.detail).toContain('999')
})

test('scenario: validation error', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { email: 'invalid' }
  })
  
  expect(response.statusCode).toBe(400)
  const body = JSON.parse(response.body)
  expect(body.errors).toHaveLength(1)
  expect(body.errors[0].field).toBe('/email')
})
```

### 13.4 Test Coverage Target

- Statements: >95%
- Branches: >90%
- Functions: >95%
- Lines: >95%

---

## 14. Configurazioni Build

### 14.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### 14.2 tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  outDir: 'dist'
})
```

### 14.3 package.json (exports)

```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./problem": {
      "types": "./dist/problem.d.ts",
      "import": "./dist/problem.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "tap test/**/*.test.ts",
    "test:coverage": "tap test/**/*.test.ts --coverage-report=html",
    "lint": "eslint src test",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

---

## 15. README.md Structure

```markdown
# fastify-problem-details

[![npm version](https://img.shields.io/npm/v/fastify-problem-details.svg)](https://www.npmjs.com/package/fastify-problem-details)
[![npm downloads](https://img.shields.io/npm/dm/fastify-problem-details.svg)](https://www.npmjs.com/package/fastify-problem-details)
[![license](https://img.shields.io/npm/l/fastify-problem-details.svg)](LICENSE)

RFC 7807/9457 Problem Details for HTTP APIs - Standardized error responses for Fastify.

## Why?

- 🎯 **Standard Compliance**: Full RFC 7807/9457 implementation
- 🔒 **Type-Safe**: Complete TypeScript support
- 🚀 **Zero Config**: Works out of the box
- 🎨 **Customizable**: Custom error types and extensions
- 📝 **Auto Documentation**: Self-documenting error responses

## Install

\`\`\`bash
npm install fastify-problem-details
\`\`\`

## Quick Start

\`\`\`typescript
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
      detail: \`User \${request.params.id} not found\`
    })
  }
  
  return user
})
\`\`\`

## Options
## Reply Methods
### reply.problem(status, options)
### reply.notFound(options)
### reply.badRequest(options)
### reply.unauthorized(options)
### reply.forbidden(options)
### reply.conflict(options)
### reply.unprocessableEntity(options)
### reply.internalServerError(options)
## Custom Problem Types
## Error Handler Integration
## TypeScript
## RFC 7807/9457 Compliance
## License

MIT
```

---

## 16. Vincoli Implementativi

1. **DEVE** usare `fastify-plugin` con `name: 'fastify-problem-details'`
2. **DEVE** supportare Fastify v5
3. **DEVE** essere ESM-only (`"type": "module"`)
4. **DEVE** avere zero dipendenze runtime (solo `fastify-plugin`)
5. **DEVE** impostare `Content-Type: application/problem+json`
6. **DEVE** rispettare l'ordine delle proprietà RFC (type, title, status, detail, instance)
7. **DEVE** sanitizzare errori in production (no stack traces, no dettagli interni)
8. **DEVE** convertire automaticamente FastifyError in Problem Details
9. **DEVE** supportare campi estesi (extensions) arbitrari
10. **NON DEVE** sovrascrivere error handler se già configurato custom
11. **DEVE** fornire metodi shortcut per tutti gli status codes comuni
12. **DEVE** permettere registrazione di tipi di problema custom

---

## 17. Output Atteso dall'Agente

L'agente deve produrre:

1. `src/types.ts` - Tutte le interfacce TypeScript
2. `src/problem.ts` - Classe ProblemDocument
3. `src/errors.ts` - Costanti errori HTTP e traduzioni
4. `src/serializer.ts` - Serializzazione JSON/XML
5. `src/plugin.ts` - Implementazione plugin completa
6. `src/index.ts` - Export pubblici
7. `test/problem.test.ts` - Test ProblemDocument
8. `test/plugin.test.ts` - Test integration plugin
9. `package.json` - Configurazione completa
10. `tsconfig.json` - Configurazione TypeScript
11. `tsup.config.ts` - Configurazione build
12. `README.md` - Documentazione completa

---

## 18. Risorse e Riferimenti

- [RFC 9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 7807 - Problem Details (superseded)](https://www.rfc-editor.org/rfc/rfc7807.html)
- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [fastify-plugin](https://github.com/fastify/fastify-plugin)
- [Microsoft REST API Guidelines - Errors](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#7102-error-condition-responses)
- [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/)

---

*Ultimo aggiornamento: Dicembre 2025*
