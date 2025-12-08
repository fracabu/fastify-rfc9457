# Ricerca Cache-Control 2025

Ricerca aggiornata su best practices HTTP Cache-Control e plugin esistenti.

---

## 1. Best Practices HTTP Cache-Control 2025

### Static Assets (CSS, JS, Images)

```
Cache-Control: public, max-age=31536000, immutable
```

- Usare **cache-busting pattern**: includere hash/versione nell'URL
- `immutable` evita rivalidazione anche su refresh utente
- Mai modificare file esistenti, creare nuove versioni con URL diversi

### Dynamic Content

```
Cache-Control: private, no-cache
```

- `no-cache` come default per contenuti dinamici (forza rivalidazione)
- `private` obbligatorio per contenuti personalizzati/autenticati
- TTL bassi per dati che cambiano frequentemente

### API Responses

```
Cache-Control: private, max-age=60, must-revalidate
```

- `must-revalidate` con ETag per validazione efficiente
- Combinare con `stale-while-revalidate` per UX migliore

### Contenuti Sensibili

```
Cache-Control: no-store
```

- `no-store` per dati sensibili (mai cached)

---

## 2. RFC 9213: CDN-Cache-Control (Standard IETF)

Header dedicato per controllare CDN separatamente dai browser.

### Esempio

```http
Cache-Control: max-age=60, s-maxage=120
CDN-Cache-Control: max-age=600
```

Risultato:
- Browser: 60 secondi
- Shared caches (proxy): 120 secondi
- CDN: 600 secondi

### Provider che lo supportano

- **Cloudflare**: `CDN-Cache-Control` e `Cloudflare-CDN-Cache-Control`
- **Vercel**: `CDN-Cache-Control` e `Vercel-CDN-Cache-Control`
- **Altri CDN**: pattern `{CDN_NAME}-CDN-Cache-Control`

---

## 3. Plugin Fastify Esistenti

### @fastify/caching (Ufficiale)

- Versione: 9.0.3
- Gestisce Cache-Control headers secondo RFC 2616 §14.9
- Supporta ETag
- Cache server-side LRU (max 100k items) - non per produzione
- Supporta abstract-cache-redis per produzione

**Limiti**: focalizzato su server-side caching, non su gestione dichiarativa headers

### fastify-response-caching

- Caching response per URL
- TTL configurabile
- Supporta condizioni su request headers

### fastify-disablecache

- Versione: 5.0.0 (aggiornato 2 mesi fa)
- Imposta headers per disabilitare cache:
  - `Cache-Control: no-store, max-age=0, must-revalidate`
  - `Expires: 0`
  - `Pragma: no-cache`
  - `Surrogate-Control: no-store`

### fastify-lcache

- Cache in-memory leggera
- TTL in minuti

---

## 4. Direttive Cache-Control Complete

### Response Directives

| Direttiva | Uso |
|-----------|-----|
| `public` | Cacheable da qualsiasi cache |
| `private` | Solo browser cache, no CDN/proxy |
| `no-cache` | Richiede rivalidazione prima di usare |
| `no-store` | Mai memorizzare |
| `no-transform` | Proxy non deve modificare contenuto |
| `must-revalidate` | Deve rivalidare quando stale |
| `proxy-revalidate` | Come must-revalidate ma solo per shared caches |
| `must-understand` | Cache deve capire la direttiva o non cacheare |
| `immutable` | Contenuto non cambierà mai (evita rivalidazione) |

### Expiration Directives

| Direttiva | Uso |
|-----------|-----|
| `max-age=N` | Freshness in secondi (browser + CDN) |
| `s-maxage=N` | Freshness solo per shared caches |
| `stale-while-revalidate=N` | Servi stale mentre rivalidhi in background |
| `stale-if-error=N` | Servi stale se origin è in errore |

---

## 5. Miglioramenti Proposti per fastify-cache-control

### 5.1 Supporto CDN-Cache-Control (RFC 9213)

```typescript
interface FastifyCacheControlOptions {
  cdnCacheControl?: CacheControlDirectives
  cdnHeader?: string  // default: 'CDN-Cache-Control', o 'Cloudflare-CDN-Cache-Control'
}
```

### 5.2 Presets Built-in

```typescript
// Presets comuni
const PRESETS = {
  static: { public: true, maxAge: 31536000, immutable: true },
  api: { private: true, noCache: true },
  realtime: { noStore: true },
  page: { public: true, maxAge: 3600, mustRevalidate: true }
}

// Uso
config: { cache: 'static' }  // invece di oggetto completo
reply.preset('static')
```

### 5.3 Pattern Matching per Route

```typescript
interface FastifyCacheControlOptions {
  rules?: Array<{
    match: string | RegExp | ((req: FastifyRequest) => boolean)
    cache: CacheControlDirectives | keyof typeof PRESETS
  }>
}

// Esempio
{
  rules: [
    { match: '/static/*', cache: 'static' },
    { match: /^\/api\//, cache: 'api' },
    { match: (req) => req.url.includes('admin'), cache: { noStore: true } }
  ]
}
```

### 5.4 Header Vary Automatico

```typescript
// Quando si usa private con fields
{ private: ['cookie', 'authorization'] }
// Genera automaticamente:
// Cache-Control: private="cookie, authorization"
// Vary: Cookie, Authorization
```

### 5.5 Supporto stale-while-revalidate/stale-if-error

Già presente nelle specifiche, ma evidenziare come best practice:

```typescript
// Pattern consigliato per API
{
  private: true,
  maxAge: 60,
  staleWhileRevalidate: 30,  // 30s extra mentre rivalidhi
  staleIfError: 300          // 5min se origin fallisce
}
```

### 5.6 Debug Mode

```typescript
interface FastifyCacheControlOptions {
  debug?: boolean  // Logga decisioni caching
}
```

---

## 6. Sources

- [Cache-Control header - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
- [HTTP caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [RFC 9213 - Targeted HTTP Cache Control](https://httpwg.org/specs/rfc9213.html)
- [CDN-Cache-Control - Cloudflare](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/)
- [Caching best practices - Fastly](https://www.fastly.com/documentation/guides/full-site-delivery/caching/caching-best-practices/)
- [@fastify/caching - npm](https://www.npmjs.com/package/@fastify/caching)
- [fastify-disablecache - npm](https://www.npmjs.com/package/fastify-disablecache)
- [HTTP caching guide - DebugBear](https://www.debugbear.com/docs/http-cache-control-header)
- [Vercel CDN-Cache-Control](https://vercel.com/changelog/proxied-responses-now-cacheable-via-cdn-cache-control-headers)