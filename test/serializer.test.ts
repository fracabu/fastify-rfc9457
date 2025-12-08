import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  serializeToJSON,
  serializeToXML,
  negotiateContentType,
  serialize,
  CONTENT_TYPES
} from '../src/serializer.js'
import type { ProblemDetails } from '../src/types.js'

describe('serializer', () => {
  describe('serializeToJSON', () => {
    it('serializes with correct property order', () => {
      const problem: ProblemDetails = {
        detail: 'User not found',
        status: 404,
        type: 'https://example.com/errors/not-found',
        title: 'Not Found',
        instance: '/users/123',
        userId: 123
      }

      const json = serializeToJSON(problem)
      const parsed = JSON.parse(json)
      const keys = Object.keys(parsed)

      // Check order: type, title, status, detail, instance, then extensions
      assert.strictEqual(keys[0], 'type')
      assert.strictEqual(keys[1], 'title')
      assert.strictEqual(keys[2], 'status')
      assert.strictEqual(keys[3], 'detail')
      assert.strictEqual(keys[4], 'instance')
      assert.strictEqual(keys[5], 'userId')
    })

    it('omits undefined fields', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Not Found',
        status: 404
      }

      const json = serializeToJSON(problem)
      const parsed = JSON.parse(json)

      assert.strictEqual('detail' in parsed, false)
      assert.strictEqual('instance' in parsed, false)
    })

    it('includes extension fields', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        errors: [{ field: 'email', message: 'Invalid' }]
      }

      const json = serializeToJSON(problem)
      const parsed = JSON.parse(json)

      assert.deepStrictEqual(parsed.errors, [{ field: 'email', message: 'Invalid' }])
    })
  })

  describe('serializeToXML', () => {
    it('serializes to valid XML structure', () => {
      const problem: ProblemDetails = {
        type: 'https://example.com/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
        instance: '/users/123'
      }

      const xml = serializeToXML(problem)

      assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'))
      assert.ok(xml.includes('<problem xmlns="urn:ietf:rfc:9457">'))
      assert.ok(xml.includes('<type>https://example.com/errors/not-found</type>'))
      assert.ok(xml.includes('<title>Not Found</title>'))
      assert.ok(xml.includes('<status>404</status>'))
      assert.ok(xml.includes('<detail>Resource not found</detail>'))
      assert.ok(xml.includes('<instance>/users/123</instance>'))
      assert.ok(xml.includes('</problem>'))
    })

    it('escapes XML special characters', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Field <name> contains invalid chars: & < > " \''
      }

      const xml = serializeToXML(problem)

      assert.ok(xml.includes('&lt;name&gt;'))
      assert.ok(xml.includes('&amp;'))
      assert.ok(xml.includes('&quot;'))
      assert.ok(xml.includes('&apos;'))
    })

    it('handles extension fields', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        customField: 'value'
      }

      const xml = serializeToXML(problem)
      assert.ok(xml.includes('<customField>value</customField>'))
    })
  })

  describe('negotiateContentType', () => {
    it('returns json when no Accept header', () => {
      assert.strictEqual(negotiateContentType(undefined, true), 'json')
    })

    it('returns json when XML not supported', () => {
      assert.strictEqual(negotiateContentType('application/problem+xml', false), 'json')
    })

    it('returns json for application/json', () => {
      assert.strictEqual(negotiateContentType('application/json', true), 'json')
    })

    it('returns json for application/problem+json', () => {
      assert.strictEqual(negotiateContentType('application/problem+json', true), 'json')
    })

    it('returns xml for application/problem+xml when supported', () => {
      assert.strictEqual(negotiateContentType('application/problem+xml', true), 'xml')
    })

    it('returns xml for application/xml when supported', () => {
      assert.strictEqual(negotiateContentType('application/xml', true), 'xml')
    })

    it('returns json for */* wildcard', () => {
      assert.strictEqual(negotiateContentType('*/*', true), 'json')
    })

    it('respects quality values', () => {
      // XML has higher quality
      const accept = 'application/problem+json;q=0.5, application/problem+xml;q=0.9'
      assert.strictEqual(negotiateContentType(accept, true), 'xml')
    })
  })

  describe('serialize', () => {
    it('returns JSON content and content type', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Not Found',
        status: 404
      }

      const result = serialize(problem, 'json')

      assert.strictEqual(result.contentType, CONTENT_TYPES.JSON)
      assert.ok(result.content.includes('"status":404'))
    })

    it('returns XML content and content type', () => {
      const problem: ProblemDetails = {
        type: 'about:blank',
        title: 'Not Found',
        status: 404
      }

      const result = serialize(problem, 'xml')

      assert.strictEqual(result.contentType, CONTENT_TYPES.XML)
      assert.ok(result.content.includes('<status>404</status>'))
    })
  })

  describe('CONTENT_TYPES', () => {
    it('has correct values', () => {
      assert.strictEqual(CONTENT_TYPES.JSON, 'application/problem+json')
      assert.strictEqual(CONTENT_TYPES.XML, 'application/problem+xml')
    })
  })
})
