import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import Fastify, { FastifyInstance } from 'fastify'
import problemDetails from '../src/index.js'

describe('fastify-problem-details plugin', () => {
  let fastify: FastifyInstance

  beforeEach(async () => {
    fastify = Fastify()
  })

  describe('registration', () => {
    it('registers plugin without options', async () => {
      await fastify.register(problemDetails)
      assert.ok(fastify.hasDecorator('problemTypes'))
      assert.ok(fastify.hasDecorator('registerProblemType'))
    })

    it('registers plugin with baseUrl', async () => {
      await fastify.register(problemDetails, {
        baseUrl: 'https://api.example.com/errors'
      })

      fastify.get('/test', (req, reply) => {
        return reply.notFound({ detail: 'Test' })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      })

      const body = JSON.parse(response.body)
      assert.strictEqual(body.type, 'https://api.example.com/errors/not-found')
    })

    it('registers plugin with custom titleMap', async () => {
      await fastify.register(problemDetails, {
        titleMap: { 404: 'Risorsa non trovata' }
      })

      fastify.get('/test', (req, reply) => {
        return reply.notFound()
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      })

      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Risorsa non trovata')
    })
  })

  describe('reply decorators', () => {
    beforeEach(async () => {
      await fastify.register(problemDetails, {
        baseUrl: 'https://api.example.com/errors'
      })
    })

    it('reply.notFound() sends 404 problem', async () => {
      fastify.get('/users/:id', (req, reply) => {
        return reply.notFound({
          detail: 'User not found'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/users/123'
      })

      assert.strictEqual(response.statusCode, 404)
      assert.ok((response.headers['content-type'] as string).includes('application/problem+json'))

      const body = JSON.parse(response.body)
      assert.strictEqual(body.type, 'https://api.example.com/errors/not-found')
      assert.strictEqual(body.title, 'Not Found')
      assert.strictEqual(body.status, 404)
      assert.strictEqual(body.detail, 'User not found')
      assert.strictEqual(body.instance, '/users/123')
    })

    it('reply.badRequest() sends 400 problem', async () => {
      fastify.post('/users', (req, reply) => {
        return reply.badRequest({
          detail: 'Invalid email format',
          errors: [{ field: 'email', message: 'Invalid format' }]
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/users'
      })

      assert.strictEqual(response.statusCode, 400)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Bad Request')
      assert.deepStrictEqual(body.errors, [{ field: 'email', message: 'Invalid format' }])
    })

    it('reply.unauthorized() sends 401 problem', async () => {
      fastify.get('/protected', (req, reply) => {
        return reply.unauthorized({
          detail: 'Authentication required'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/protected'
      })

      assert.strictEqual(response.statusCode, 401)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Unauthorized')
    })

    it('reply.forbidden() sends 403 problem', async () => {
      fastify.get('/admin', (req, reply) => {
        return reply.forbidden({
          detail: 'Admin access required'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/admin'
      })

      assert.strictEqual(response.statusCode, 403)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Forbidden')
    })

    it('reply.conflict() sends 409 problem', async () => {
      fastify.post('/resources', (req, reply) => {
        return reply.conflict({
          detail: 'Resource already exists'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/resources'
      })

      assert.strictEqual(response.statusCode, 409)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Conflict')
    })

    it('reply.unprocessableEntity() sends 422 problem', async () => {
      fastify.post('/orders', (req, reply) => {
        return reply.unprocessableEntity({
          detail: 'Not enough stock',
          available: 5,
          requested: 10
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/orders'
      })

      assert.strictEqual(response.statusCode, 422)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Unprocessable Content')
      assert.strictEqual(body.available, 5)
      assert.strictEqual(body.requested, 10)
    })

    it('reply.tooManyRequests() sends 429 problem', async () => {
      fastify.get('/api', (req, reply) => {
        return reply.tooManyRequests({
          detail: 'Rate limit exceeded',
          retryAfter: 60
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/api'
      })

      assert.strictEqual(response.statusCode, 429)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Too Many Requests')
      assert.strictEqual(body.retryAfter, 60)
    })

    it('reply.internalServerError() sends 500 problem', async () => {
      fastify.get('/error', (req, reply) => {
        return reply.internalServerError({
          detail: 'Something went wrong'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/error'
      })

      assert.strictEqual(response.statusCode, 500)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Internal Server Error')
    })

    it('reply.serviceUnavailable() sends 503 problem', async () => {
      fastify.get('/health', (req, reply) => {
        return reply.serviceUnavailable({
          detail: 'Service under maintenance'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/health'
      })

      assert.strictEqual(response.statusCode, 503)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, 'Service Unavailable')
    })

    it('reply.problem() sends custom status problem', async () => {
      fastify.get('/custom', (req, reply) => {
        return reply.problem(418, {
          detail: "I'm a teapot",
          brewTime: '5 minutes'
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/custom'
      })

      assert.strictEqual(response.statusCode, 418)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.title, "I'm a Teapot")
      assert.strictEqual(body.brewTime, '5 minutes')
    })

    it('reply.problem() includes extensions', async () => {
      fastify.post('/transfer', (req, reply) => {
        return reply.problem(403, {
          type: 'https://api.example.com/errors/insufficient-funds',
          title: 'Insufficient Funds',
          detail: 'Your balance is €30, but the transfer requires €50',
          balance: 30,
          required: 50
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/transfer'
      })

      const body = JSON.parse(response.body)
      assert.strictEqual(body.type, 'https://api.example.com/errors/insufficient-funds')
      assert.strictEqual(body.title, 'Insufficient Funds')
      assert.strictEqual(body.balance, 30)
      assert.strictEqual(body.required, 50)
    })
  })

  describe('error handler', () => {
    beforeEach(async () => {
      await fastify.register(problemDetails, {
        baseUrl: 'https://api.example.com/errors'
      })
    })

    it('converts Error to 500 problem', async () => {
      fastify.get('/throw', () => {
        throw new Error('Something went wrong')
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/throw'
      })

      assert.strictEqual(response.statusCode, 500)
      assert.ok((response.headers['content-type'] as string).includes('application/problem+json'))

      const body = JSON.parse(response.body)
      assert.strictEqual(body.type, 'https://api.example.com/errors/internal-server-error')
      assert.strictEqual(body.status, 500)
    })

    it('converts FastifyError to problem', async () => {
      fastify.get('/not-found', () => {
        const error = new Error('Resource not found') as Error & { statusCode: number }
        error.statusCode = 404
        throw error
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/not-found'
      })

      assert.strictEqual(response.statusCode, 404)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.status, 404)
    })

    it('converts validation error with details', async () => {
      fastify.post('/users', {
        schema: {
          body: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' }
            }
          }
        }
      }, () => {
        return { success: true }
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/users',
        payload: { email: 'invalid' }
      })

      assert.strictEqual(response.statusCode, 400)
      const body = JSON.parse(response.body)
      assert.strictEqual(body.status, 400)
      assert.ok(Array.isArray(body.errors))
    })
  })

  describe('content-type', () => {
    beforeEach(async () => {
      await fastify.register(problemDetails, {
        supportXml: true
      })
    })

    it('sets Content-Type: application/problem+json', async () => {
      fastify.get('/test', (req, reply) => {
        return reply.notFound()
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      })

      assert.ok((response.headers['content-type'] as string).includes('application/problem+json'))
    })

    it('supports Accept: application/problem+xml', async () => {
      fastify.get('/test', (req, reply) => {
        return reply.notFound({ detail: 'Not found' })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          accept: 'application/problem+xml'
        }
      })

      assert.ok((response.headers['content-type'] as string).includes('application/problem+xml'))
      assert.ok(response.body.includes('<?xml'))
      assert.ok(response.body.includes('<problem'))
    })
  })

  describe('custom problem types', () => {
    beforeEach(async () => {
      await fastify.register(problemDetails, {
        baseUrl: 'https://api.example.com/errors'
      })
    })

    it('registerProblemType registers new type', async () => {
      fastify.registerProblemType('insufficient-funds', {
        status: 403,
        title: 'Insufficient Funds'
      })

      assert.ok(fastify.problemTypes.has('insufficient-funds'))
      const registered = fastify.problemTypes.get('insufficient-funds')
      assert.strictEqual(registered?.status, 403)
      assert.strictEqual(registered?.title, 'Insufficient Funds')
    })

    it('uses registered type with reply.problem()', async () => {
      fastify.registerProblemType('insufficient-funds', {
        status: 403,
        title: 'Insufficient Funds'
      })

      fastify.post('/transfer', (req, reply) => {
        return reply.problem(403, {
          type: 'insufficient-funds',
          detail: 'Not enough balance',
          balance: 30,
          required: 50
        })
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'POST',
        url: '/transfer'
      })

      const body = JSON.parse(response.body)
      assert.strictEqual(body.type, 'https://api.example.com/errors/insufficient-funds')
      assert.strictEqual(body.title, 'Insufficient Funds')
    })
  })

  describe('onProblem hook', () => {
    it('calls onProblem before sending', async () => {
      let capturedProblem: any = null
      let capturedRequest: any = null

      await fastify.register(problemDetails, {
        onProblem: (problem, request) => {
          capturedProblem = problem
          capturedRequest = request
        }
      })

      fastify.get('/test', (req, reply) => {
        return reply.notFound({ detail: 'Test' })
      })

      await fastify.ready()
      await fastify.inject({
        method: 'GET',
        url: '/test'
      })

      assert.ok(capturedProblem)
      assert.strictEqual(capturedProblem.status, 404)
      assert.ok(capturedRequest)
      assert.strictEqual(capturedRequest.url, '/test')
    })

    it('onProblem receives problem and request', async () => {
      const problems: any[] = []

      await fastify.register(problemDetails, {
        onProblem: (problem, request) => {
          problems.push({ problem, url: request.url })
        }
      })

      fastify.get('/a', (req, reply) => reply.notFound())
      fastify.get('/b', (req, reply) => reply.badRequest())

      await fastify.ready()
      await fastify.inject({ method: 'GET', url: '/a' })
      await fastify.inject({ method: 'GET', url: '/b' })

      assert.strictEqual(problems.length, 2)
      assert.strictEqual(problems[0].problem.status, 404)
      assert.strictEqual(problems[0].url, '/a')
      assert.strictEqual(problems[1].problem.status, 400)
      assert.strictEqual(problems[1].url, '/b')
    })
  })

  describe('createProblem', () => {
    beforeEach(async () => {
      await fastify.register(problemDetails)
    })

    it('creates problem without sending', async () => {
      let createdProblem: any = null

      fastify.get('/test', (req, reply) => {
        createdProblem = reply.createProblem(404, { detail: 'Not found' })
        return { created: true }
      })

      await fastify.ready()
      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      })

      assert.strictEqual(response.statusCode, 200)
      assert.ok(createdProblem)
      assert.strictEqual(createdProblem.status, 404)
      assert.strictEqual(createdProblem.detail, 'Not found')
    })
  })
})
