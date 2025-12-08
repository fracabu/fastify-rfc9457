import { describe, it } from 'node:test'
import assert from 'node:assert'
import { ProblemDocument } from '../src/problem.js'

describe('ProblemDocument', () => {
  describe('constructor', () => {
    it('creates ProblemDocument with all fields', () => {
      const doc = new ProblemDocument({
        status: 404,
        title: 'Not Found',
        type: 'https://example.com/errors/not-found',
        detail: 'User with ID 123 was not found',
        instance: '/users/123'
      })

      assert.strictEqual(doc.status, 404)
      assert.strictEqual(doc.title, 'Not Found')
      assert.strictEqual(doc.type, 'https://example.com/errors/not-found')
      assert.strictEqual(doc.detail, 'User with ID 123 was not found')
      assert.strictEqual(doc.instance, '/users/123')
    })

    it('creates ProblemDocument with minimal fields', () => {
      const doc = new ProblemDocument({ status: 500 })

      assert.strictEqual(doc.status, 500)
      assert.strictEqual(doc.title, 'Internal Server Error')
      assert.strictEqual(doc.type, 'about:blank')
      assert.strictEqual(doc.detail, undefined)
      assert.strictEqual(doc.instance, undefined)
    })

    it('creates ProblemDocument with custom extensions', () => {
      const doc = new ProblemDocument({
        status: 403,
        detail: 'Insufficient funds',
        extensions: {
          balance: 30,
          required: 50,
          accounts: ['/account/123', '/account/456']
        }
      })

      assert.strictEqual(doc.status, 403)
      assert.strictEqual(doc.balance, 30)
      assert.strictEqual(doc.required, 50)
      assert.deepStrictEqual(doc.accounts, ['/account/123', '/account/456'])
    })

    it('throws error for invalid status code (2xx)', () => {
      assert.throws(() => {
        new ProblemDocument({ status: 200 })
      }, /Invalid status code: 200/)
    })

    it('throws error for invalid status code (3xx)', () => {
      assert.throws(() => {
        new ProblemDocument({ status: 301 })
      }, /Invalid status code: 301/)
    })

    it('uses default title from HTTP_STATUS_TITLES', () => {
      const doc = new ProblemDocument({ status: 422 })
      assert.strictEqual(doc.title, 'Unprocessable Content')
    })
  })

  describe('toJSON', () => {
    it('serializes with correct property order', () => {
      const doc = new ProblemDocument({
        status: 400,
        detail: 'Invalid email',
        type: 'https://example.com/errors/bad-request',
        extensions: { field: 'email' }
      })

      const json = doc.toJSON()
      const keys = Object.keys(json)

      assert.strictEqual(keys[0], 'type')
      assert.strictEqual(keys[1], 'title')
      assert.strictEqual(keys[2], 'status')
      assert.strictEqual(keys[3], 'detail')
      // Extensions come after standard fields
      assert.ok(keys.indexOf('field') > keys.indexOf('detail'))
    })

    it('omits undefined fields', () => {
      const doc = new ProblemDocument({ status: 404 })
      const json = doc.toJSON()

      assert.strictEqual('detail' in json, false)
      assert.strictEqual('instance' in json, false)
    })

    it('includes extensions after standard fields', () => {
      const doc = new ProblemDocument({
        status: 400,
        extensions: {
          errors: [{ field: 'email', message: 'Invalid format' }]
        }
      })

      const json = doc.toJSON()
      assert.deepStrictEqual(json.errors, [{ field: 'email', message: 'Invalid format' }])
    })
  })

  describe('toXML', () => {
    it('serializes to valid XML', () => {
      const doc = new ProblemDocument({
        status: 404,
        type: 'https://example.com/errors/not-found',
        detail: 'Resource not found'
      })

      const xml = doc.toXML()

      assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'))
      assert.ok(xml.includes('<problem xmlns="urn:ietf:rfc:9457">'))
      assert.ok(xml.includes('<type>https://example.com/errors/not-found</type>'))
      assert.ok(xml.includes('<title>Not Found</title>'))
      assert.ok(xml.includes('<status>404</status>'))
      assert.ok(xml.includes('<detail>Resource not found</detail>'))
      assert.ok(xml.includes('</problem>'))
    })

    it('escapes special XML characters', () => {
      const doc = new ProblemDocument({
        status: 400,
        detail: 'Invalid <email> & "name"'
      })

      const xml = doc.toXML()
      assert.ok(xml.includes('Invalid &lt;email&gt; &amp; &quot;name&quot;'))
    })
  })

  describe('factory methods', () => {
    it('ProblemDocument.notFound() creates 404', () => {
      const doc = ProblemDocument.notFound('User not found')

      assert.strictEqual(doc.status, 404)
      assert.strictEqual(doc.title, 'Not Found')
      assert.strictEqual(doc.detail, 'User not found')
    })

    it('ProblemDocument.badRequest() creates 400', () => {
      const doc = ProblemDocument.badRequest('Invalid input', { field: 'email' })

      assert.strictEqual(doc.status, 400)
      assert.strictEqual(doc.title, 'Bad Request')
      assert.strictEqual(doc.detail, 'Invalid input')
      assert.strictEqual(doc.field, 'email')
    })

    it('ProblemDocument.unauthorized() creates 401', () => {
      const doc = ProblemDocument.unauthorized()

      assert.strictEqual(doc.status, 401)
      assert.strictEqual(doc.title, 'Unauthorized')
    })

    it('ProblemDocument.forbidden() creates 403', () => {
      const doc = ProblemDocument.forbidden('Access denied')

      assert.strictEqual(doc.status, 403)
      assert.strictEqual(doc.title, 'Forbidden')
    })

    it('ProblemDocument.conflict() creates 409', () => {
      const doc = ProblemDocument.conflict('Resource already exists')

      assert.strictEqual(doc.status, 409)
      assert.strictEqual(doc.title, 'Conflict')
    })

    it('ProblemDocument.unprocessableEntity() creates 422', () => {
      const doc = ProblemDocument.unprocessableEntity('Validation failed')

      assert.strictEqual(doc.status, 422)
      assert.strictEqual(doc.title, 'Unprocessable Content')
    })

    it('ProblemDocument.tooManyRequests() creates 429', () => {
      const doc = ProblemDocument.tooManyRequests('Rate limit exceeded', { retryAfter: 60 })

      assert.strictEqual(doc.status, 429)
      assert.strictEqual(doc.title, 'Too Many Requests')
      assert.strictEqual(doc.retryAfter, 60)
    })

    it('ProblemDocument.internalServerError() creates 500', () => {
      const doc = ProblemDocument.internalServerError()

      assert.strictEqual(doc.status, 500)
      assert.strictEqual(doc.title, 'Internal Server Error')
    })

    it('ProblemDocument.serviceUnavailable() creates 503', () => {
      const doc = ProblemDocument.serviceUnavailable('Service under maintenance')

      assert.strictEqual(doc.status, 503)
      assert.strictEqual(doc.title, 'Service Unavailable')
    })
  })
})
