import Fastify from 'fastify'
// When installed from npm: import problemDetails from 'fastify-rfc9457'
import problemDetails from './dist/index.js'

const fastify = Fastify({ logger: true })

await fastify.register(problemDetails, {
  baseUrl: 'https://api.example.com/errors'
})

// Test 404
fastify.get('/users/:id', async (req, reply) => {
  return reply.notFound({
    detail: `User ${req.params.id} not found`
  })
})

// Test 400 con validazione
fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['email', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 2 }
      }
    }
  }
}, async (req, reply) => {
  return { success: true }
})

// Test 403 con estensioni custom
fastify.post('/transfer', async (req, reply) => {
  return reply.problem(403, {
    type: 'insufficient-funds',
    title: 'Insufficient Funds',
    detail: 'Your balance is €30, but the transfer requires €50',
    balance: 30,
    required: 50
  })
})

// Test 429 rate limit
fastify.get('/api/data', async (req, reply) => {
  return reply.tooManyRequests({
    detail: 'Rate limit exceeded',
    retryAfter: 60
  })
})

// Test 500 errore generico
fastify.get('/crash', async () => {
  throw new Error('Something went wrong!')
})

// Rotta che funziona
fastify.get('/health', async () => {
  return { status: 'ok' }
})

await fastify.listen({ port: 3000 })
console.log('\n🚀 Server running at http://localhost:3000')
console.log('\nTest these endpoints:')
console.log('  curl http://localhost:3000/users/123')
console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{}"')
console.log('  curl -X POST http://localhost:3000/transfer')
console.log('  curl http://localhost:3000/api/data')
console.log('  curl http://localhost:3000/crash')
console.log('  curl http://localhost:3000/health')
