import { NextResponse } from 'next/server'

import {
  MAX_RESULTS,
  buildResearchResponse,
  createApiError,
  normalizeTavilyResults,
  validateRequestBody,
} from '@/lib/research'

export const runtime = 'nodejs'

const REQUEST_TIMEOUT_MS = 15000

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const validated = validateRequestBody(body)

    if (!validated.ok) {
      return NextResponse.json(
        createApiError(validated.error.code, validated.error.message),
        { status: 400 },
      )
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY
    if (!tavilyApiKey) {
      return NextResponse.json(
        createApiError(
          'MISSING_API_KEY',
          'TAVILY_API_KEY is not configured. Add it to your environment before running research.',
        ),
        { status: 500 },
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyApiKey}`,
        },
        body: JSON.stringify({
          query: validated.value.query,
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          max_results: MAX_RESULTS,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return NextResponse.json(
          createApiError(
            'PROVIDER_FAILURE',
            'The external search provider is temporarily unavailable. Please try again in a few moments.',
          ),
          { status: 502 },
        )
      }

      const payload = await response.json()
      const results = normalizeTavilyResults(payload)

      return NextResponse.json(
        buildResearchResponse(validated.value.query, results, {
          budget: validated.value.budget,
          priority: validated.value.priority,
        }),
        { status: 200 },
      )
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        createApiError('TIMEOUT', 'The search request timed out after 15 seconds.'),
        { status: 504 },
      )
    }

    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'The research service could not complete the request.'),
      { status: 500 },
    )
  }
}