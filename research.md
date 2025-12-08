# Ricerca Problem Details 2025

Ricerca aggiornata su RFC 7807/9457 Problem Details, best practices e plugin esistenti.

---

## 1. RFC 9457 Problem Details (Standard IETF)

### 1.1 Cos'è Problem Details?

RFC 9457 (che sostituisce RFC 7807) definisce un formato standard per rappresentare errori nelle HTTP API. Evita la necessità di definire nuovi formati di risposta errore per ogni API.

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 403,
  "detail": "Your current balance is €30, but the transfer requires €50.",
  "instance": "/transfers/12345",
  "balance": 30,
  "required": 50
}
```

### 1.2 Campi Standard

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `type` | URI | Identifica il tipo di problema. Default: `about:blank` |
| `title` | string | Sommario human-readable (NON deve cambiare tra occorrenze) |
| `status` | integer | HTTP status code |
| `detail` | string | Spiegazione specifica dell'occorrenza (DEVE essere diversa) |
| `instance` | URI | Identifica l'occorrenza specifica |

### 1.3 Content-Type

```
Content-Type: application/problem+json
Content-Type: application/problem+xml  (opzionale)
```

---

## 2. RFC 9457 vs RFC 7807 - Differenze

RFC 9457 è retrocompatibile con RFC 7807. Cambiamenti principali:

### 2.1 Registry di Problem Types

Nuovo registry IANA condiviso per tipi di problema riutilizzabili globalmente. Attualmente registrato solo `about:blank`.

### 2.2 Multiple Problems

RFC 9457 sconsiglia fortemente di riportare errori di tipi diversi nella stessa risposta. Si riporta solo l'errore prioritario.

### 2.3 Extension Members

Associazione più chiara tra problem types e campi aggiuntivi che il client deve aspettarsi.

### 2.4 Migrazione

Non c'è urgenza di migrare da RFC 7807. Il formato è identico, RFC 9457 aggiunge best practices.

---

## 3. Plugin Node.js/Fastify Esistenti

### 3.1 http-problem-details (PDMLab)

- **Pacchetto**: `http-problem-details`
- **Stato**: Attivo, TypeScript nativo
- **Downloads**: ~2000/settimana

```typescript
import { ProblemDocument, ProblemDocumentExtension } from 'http-problem-details'

const doc = new ProblemDocument({
  type: 'https://example.com/probs/out-of-credit',
  title: 'You do not have enough credit.',
  detail: 'Your current balance is 30, but that costs 50.',
  instance: '/account/12345/msgs/abc',
  status: 400
})

// Con estensioni
const extension = new ProblemDocumentExtension({
  balance: 30,
  accounts: ['/account/12345', '/account/67890']
})

const doc = new ProblemDocument({ ... }, extension)
```

**Limiti**: Nessuna integrazione diretta con Fastify, richiede wrapper manuale.

### 3.2 express-http-problem-details

- **Pacchetto**: `express-http-problem-details`
- Middleware Express per mappare errori a Problem Details
- Usa `http-problem-details-mapper` per configurare mapping

**Limiti**: Solo Express, non Fastify.

### 3.3 nest-problem-details-filter (NestJS)

- **Pacchetto**: `nest-problem-details-filter`
- Exception filter per NestJS
- Supporta Fastify come adapter
- Versione: 1.0.0 (5 mesi fa)

### 3.4 @fastify/sensible

- **Pacchetto**: `@fastify/sensible`
- Decoratori `reply.notFound()`, `fastify.httpErrors.notFound()`
- **NON** implementa Problem Details RFC 7807/9457
- Formato errore standard Fastify, non `application/problem+json`

### 3.5 fastify-http-errors-enhanced

- **Pacchetto**: `fastify-http-errors-enhanced`
- Error handler con HTTP errors enhanced
- Formato compatibile con Fastify standard, non RFC 7807

### 3.6 Conclusione Gap

**Non esiste un plugin Fastify nativo per Problem Details RFC 9457** che:
- Sia specifico per Fastify v5
- Usi `application/problem+json`
- Fornisca decoratori reply nativi
- Converta automaticamente errori Fastify
- Supporti tipi custom registrabili

---

## 4. Implementazioni in Altri Framework

### 4.1 ASP.NET Core (.NET 8/9)

```csharp
// .NET 8+
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
app.UseStatusCodePages();

// Validation errors
public class ValidationProblemDetails : ProblemDetails {
    public IDictionary<string, string[]> Errors { get; set; }
}
```

Output:
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 4.2 Java (Zalando Problem Library)

```java
Problem problem = Problem.builder()
    .withType(URI.create("https://example.org/out-of-stock"))
    .withTitle("Out of Stock")
    .withStatus(Status.BAD_REQUEST)
    .withDetail("Item 123 is out of stock")
    .with("item", 123)
    .build();
```

### 4.3 Micronaut

```java
@Produces(MediaType.APPLICATION_PROBLEM_JSON)
public HttpResponse<Problem> handle() {
    return HttpResponse.badRequest(Problem.builder()
        .withStatus(new HttpStatusType(HttpStatus.BAD_REQUEST))
        .withTitle("Bad Request")
        .build());
}
```

---

## 5. Best Practices 2025

### 5.1 Validation Errors

Formato raccomandato per errori di validazione:

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more fields failed validation",
  "errors": [
    {
      "field": "/email",
      "message": "must be a valid email address",
      "code": "format"
    },
    {
      "field": "/age",
      "message": "must be at least 18",
      "code": "minimum"
    }
  ]
}
```

### 5.2 Sicurezza

- **MAI** includere stack traces in production
- **MAI** esporre dettagli interni per errori 5xx
- **MAI** esporre path filesystem
- Sanitizzare messaggi di errore database

### 5.3 Client Robustness (Zalando Guidelines)

I client devono:
- Non fare affidamento su Problem JSON sempre presente
- Gestire risposte da infrastructure components (proxy, CDN)
- Includere `Accept: application/problem+json` negli header

### 5.4 Type URI

- Usare URI risolvibili che puntano a documentazione
- Pattern: `https://api.example.com/errors/{error-type}`
- Default `about:blank` se non si vuole documentare

---

## 6. Formati Errore Aziende

### 6.1 Stripe

```json
{
  "error": {
    "type": "card_error",
    "code": "card_declined",
    "message": "Your card was declined.",
    "param": "card_number",
    "decline_code": "insufficient_funds"
  }
}
```
**NON** usa RFC 7807, formato proprietario.

### 6.2 Google Cloud

```json
{
  "error": {
    "code": 400,
    "message": "Invalid value",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "INVALID_PARAMETER",
        "domain": "storage.googleapis.com"
      }
    ]
  }
}
```
Usa `google.rpc.Status`, non RFC 7807.

### 6.3 Microsoft Azure

Formati variabili per servizio, OData-style per alcuni. Non standardizzato su RFC 7807.

### 6.4 Zalando

Usa RFC 9457 come standard aziendale. Guidelines pubbliche:
- https://opensource.zalando.com/restful-api-guidelines/

---

## 7. Content Negotiation

### 7.1 Accept Header

```
Accept: application/problem+json
Accept: application/json
Accept: application/problem+xml
```

### 7.2 Priorità Risposta

1. `application/problem+json` se richiesto
2. `application/problem+xml` se richiesto e supportato
3. `application/json` come fallback

### 7.3 Vary Header

```
Vary: Accept
```

---

## 8. Considerazioni Implementative per fastify-problem-details

### 8.1 Integrazione Error Handler

```typescript
fastify.setErrorHandler((error, request, reply) => {
  // Convertire FastifyError in ProblemDocument
  // Gestire validation errors (error.validation)
  // Sanitizzare in production
})
```

### 8.2 Reply Decorators Proposti

```typescript
reply.problem(status, options)        // Generico
reply.notFound(options)               // 404
reply.badRequest(options)             // 400
reply.unauthorized(options)           // 401
reply.forbidden(options)              // 403
reply.conflict(options)               // 409
reply.unprocessableEntity(options)    // 422
reply.tooManyRequests(options)        // 429
reply.internalServerError(options)    // 500
reply.serviceUnavailable(options)     // 503
```

### 8.3 Custom Problem Types

```typescript
fastify.registerProblemType('insufficient-funds', {
  status: 403,
  title: 'Insufficient Funds',
  type: 'https://api.example.com/errors/insufficient-funds'
})
```

### 8.4 Conversione Errori Fastify

| Fastify Error | Problem Details |
|---------------|-----------------|
| FST_ERR_VALIDATION | 400 + errors array |
| FST_ERR_NOT_FOUND | 404 |
| Generic Error | 500 (sanitized in prod) |

---

## 9. Sources

- [RFC 9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 7807 - Problem Details (obsoleted)](https://www.rfc-editor.org/rfc/rfc7807.html)
- [Swagger - Problem Details RFC 9457](https://swagger.io/blog/problem-details-rfc9457-doing-api-errors-well/)
- [Redocly - RFC 9457 Better information for bad situations](https://redocly.com/blog/problem-details-9457)
- [Nicolas Fränkel - RFC 7807 is dead, long live RFC 9457](https://blog.frankel.ch/problem-details-http-apis/)
- [Zalando RESTful API Guidelines](https://opensource.zalando.com/restful-api-guidelines/)
- [http-problem-details - GitHub](https://github.com/PDMLab/http-problem-details)
- [Fastify Error Handling](https://fastify.dev/docs/latest/Reference/Errors/)
- [@fastify/sensible - GitHub](https://github.com/fastify/fastify-sensible)
- [Problem Details for ASP.NET Core](https://www.milanjovanovic.tech/blog/problem-details-for-aspnetcore-apis)
- [Zalando Problem Library (Java)](https://github.com/zalando/problem)
- [Zuplo - Best Practices API Error Handling](https://zuplo.com/blog/2025/02/11/best-practices-for-api-error-handling)
- [Medium - Structuring validation errors in REST APIs](https://medium.com/@k3nn7/structuring-validation-errors-in-rest-apis-40c15fbb7bc3)
- [Stripe API Errors](https://docs.stripe.com/api/errors)
- [Google Cloud API Errors](https://google.aip.dev/193)

---

*Ultimo aggiornamento: Dicembre 2025*
