import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  HTTP_STATUS_TITLES,
  HTTP_STATUS_TYPE_SLUGS,
  HTTP_STATUS_TITLES_IT,
  getStatusTitle,
  getTypeSlug,
  isClientError,
  isServerError,
  isValidProblemStatus
} from '../src/errors.js'

describe('errors', () => {
  describe('HTTP_STATUS_TITLES', () => {
    it('has correct titles for common 4xx errors', () => {
      assert.strictEqual(HTTP_STATUS_TITLES[400], 'Bad Request')
      assert.strictEqual(HTTP_STATUS_TITLES[401], 'Unauthorized')
      assert.strictEqual(HTTP_STATUS_TITLES[403], 'Forbidden')
      assert.strictEqual(HTTP_STATUS_TITLES[404], 'Not Found')
      assert.strictEqual(HTTP_STATUS_TITLES[409], 'Conflict')
      assert.strictEqual(HTTP_STATUS_TITLES[422], 'Unprocessable Content')
      assert.strictEqual(HTTP_STATUS_TITLES[429], 'Too Many Requests')
    })

    it('has correct titles for common 5xx errors', () => {
      assert.strictEqual(HTTP_STATUS_TITLES[500], 'Internal Server Error')
      assert.strictEqual(HTTP_STATUS_TITLES[501], 'Not Implemented')
      assert.strictEqual(HTTP_STATUS_TITLES[502], 'Bad Gateway')
      assert.strictEqual(HTTP_STATUS_TITLES[503], 'Service Unavailable')
      assert.strictEqual(HTTP_STATUS_TITLES[504], 'Gateway Timeout')
    })
  })

  describe('HTTP_STATUS_TYPE_SLUGS', () => {
    it('has correct slugs for common errors', () => {
      assert.strictEqual(HTTP_STATUS_TYPE_SLUGS[400], 'bad-request')
      assert.strictEqual(HTTP_STATUS_TYPE_SLUGS[401], 'unauthorized')
      assert.strictEqual(HTTP_STATUS_TYPE_SLUGS[404], 'not-found')
      assert.strictEqual(HTTP_STATUS_TYPE_SLUGS[500], 'internal-server-error')
    })
  })

  describe('HTTP_STATUS_TITLES_IT', () => {
    it('has Italian translations', () => {
      assert.strictEqual(HTTP_STATUS_TITLES_IT[400], 'Richiesta Non Valida')
      assert.strictEqual(HTTP_STATUS_TITLES_IT[404], 'Non Trovato')
      assert.strictEqual(HTTP_STATUS_TITLES_IT[500], 'Errore Interno del Server')
    })
  })

  describe('getStatusTitle', () => {
    it('returns English title by default', () => {
      assert.strictEqual(getStatusTitle(404), 'Not Found')
      assert.strictEqual(getStatusTitle(500), 'Internal Server Error')
    })

    it('returns Italian title when specified', () => {
      assert.strictEqual(getStatusTitle(404, 'it'), 'Non Trovato')
      assert.strictEqual(getStatusTitle(500, 'it'), 'Errore Interno del Server')
    })

    it('falls back to English for unknown language', () => {
      assert.strictEqual(getStatusTitle(404, 'xx' as any), 'Not Found')
    })

    it('returns Unknown Error for unknown status', () => {
      assert.strictEqual(getStatusTitle(999), 'Unknown Error')
    })
  })

  describe('getTypeSlug', () => {
    it('returns slug for known status', () => {
      assert.strictEqual(getTypeSlug(404), 'not-found')
      assert.strictEqual(getTypeSlug(500), 'internal-server-error')
    })

    it('returns error-{status} for unknown status', () => {
      assert.strictEqual(getTypeSlug(499), 'error-499')
    })
  })

  describe('isClientError', () => {
    it('returns true for 4xx codes', () => {
      assert.strictEqual(isClientError(400), true)
      assert.strictEqual(isClientError(404), true)
      assert.strictEqual(isClientError(499), true)
    })

    it('returns false for non-4xx codes', () => {
      assert.strictEqual(isClientError(200), false)
      assert.strictEqual(isClientError(301), false)
      assert.strictEqual(isClientError(500), false)
    })
  })

  describe('isServerError', () => {
    it('returns true for 5xx codes', () => {
      assert.strictEqual(isServerError(500), true)
      assert.strictEqual(isServerError(503), true)
      assert.strictEqual(isServerError(599), true)
    })

    it('returns false for non-5xx codes', () => {
      assert.strictEqual(isServerError(200), false)
      assert.strictEqual(isServerError(404), false)
    })
  })

  describe('isValidProblemStatus', () => {
    it('returns true for 4xx and 5xx codes', () => {
      assert.strictEqual(isValidProblemStatus(400), true)
      assert.strictEqual(isValidProblemStatus(404), true)
      assert.strictEqual(isValidProblemStatus(500), true)
      assert.strictEqual(isValidProblemStatus(503), true)
    })

    it('returns false for other codes', () => {
      assert.strictEqual(isValidProblemStatus(200), false)
      assert.strictEqual(isValidProblemStatus(201), false)
      assert.strictEqual(isValidProblemStatus(301), false)
      assert.strictEqual(isValidProblemStatus(302), false)
    })
  })
})
