import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MAX_QUERY_LENGTH,
  buildResearchResponse,
  normalizeTavilyResults,
  validateRequestBody,
} from './research'

test('validateRequestBody rejects an empty query', () => {
  const result = validateRequestBody({ query: '   ' })
  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('Expected validation to fail for empty query')
  }
  assert.equal(result.error.code, 'INVALID_QUERY')
})

test('validateRequestBody accepts valid preferences', () => {
  const result = validateRequestBody({
    query: 'Best wireless headphones under $250',
    budget: 'Under ₹5,000',
    priority: 'Best value',
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    throw new Error('Expected validation to succeed for valid request')
  }
  assert.equal(result.value.query, 'Best wireless headphones under $250')
})

test('validateRequestBody rejects overlong query strings', () => {
  const result = validateRequestBody({
    query: 'x'.repeat(MAX_QUERY_LENGTH + 1),
  })

  assert.equal(result.ok, false)
  if (result.ok) {
    throw new Error('Expected validation to fail for overlong query')
  }
  assert.equal(result.error.code, 'INVALID_QUERY')
})

test('normalizeTavilyResults keeps valid URLs and drops invalid ones', () => {
  const results = normalizeTavilyResults({
    results: [
      { title: 'Good result', url: 'https://example.com/one', content: 'First item' },
      { title: 'Bad result', url: 'javascript:alert(1)', content: 'Nope' },
      { title: 'Second good', url: 'https://example.org/two', content: 'Second item' },
    ],
  })

  assert.equal(results.length, 2)
  assert.equal(results[0].url, 'https://example.com/one')
  assert.equal(results[1].url, 'https://example.org/two')
})

test('buildResearchResponse marks the data as search results rather than demo content', () => {
  const response = buildResearchResponse(
    'Wireless earbuds',
    [
      {
        title: 'Example result',
        url: 'https://example.com',
        snippet: 'Some relevant information.',
      },
    ],
    {
      budget: 'Flexible',
      priority: 'Balanced',
    },
  )

  assert.equal(response.provider, 'tavily')
  assert.equal(response.isDemo, false)
  assert.equal(response.results.length, 1)
  assert.match(response.warnings[0], /not a verified recommendation/i)
})
