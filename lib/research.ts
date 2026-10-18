export const MAX_QUERY_LENGTH = 500
export const MAX_RESULTS = 8
export const MAX_SNIPPET_LENGTH = 540

export const VALID_BUDGETS = [
  'Flexible',
  'Under ₹2,000',
  'Under ₹5,000',
  'Under ₹10,000',
  'Under ₹25,000',
] as const

export const VALID_PRIORITIES = [
  'Balanced',
  'Best quality',
  'Best value',
  'Reliability first',
  'Comfort and ease',
] as const

export type ResearchBudget = (typeof VALID_BUDGETS)[number]
export type ResearchPriority = (typeof VALID_PRIORITIES)[number]

export interface ResearchPreferences {
  budget: ResearchBudget
  priority: ResearchPriority
}

export interface ResearchRequestBody {
  query: string
  budget?: string
  priority?: string
}

export interface ResearchResultItem {
  title: string
  url: string
  snippet: string
  source?: string
  sourceType?: string
  publishedDate?: string
}

export interface ResearchResponse {
  query: string
  results: ResearchResultItem[]
  totalResults: number
  provider: 'tavily'
  generatedAt: string
  warnings: string[]
  isDemo: false
  preferences: ResearchPreferences
}

export interface ApiError {
  code: string
  message: string
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeText(value: unknown, fallback: string, maxLength = MAX_SNIPPET_LENGTH) {
  if (typeof value !== 'string') return fallback
  const normalized = normalizeWhitespace(value)
  if (!normalized) return fallback
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trimEnd()}…` : normalized
}

export function normalizeQuery(value: unknown) {
  if (typeof value !== 'string') return ''
  return normalizeWhitespace(value)
}

export function validateRequestBody(raw: unknown):
  | { ok: true; value: ResearchRequestBody }
  | { ok: false; error: { code: string; message: string } } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'The request body must be a JSON object.',
      },
    }
  }

  const body = raw as Record<string, unknown>
  const query = normalizeQuery(body.query)

  if (!query) {
    return {
      ok: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Please enter a research question.',
      },
    }
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      error: {
        code: 'INVALID_QUERY',
        message: `Research questions must be shorter than ${MAX_QUERY_LENGTH} characters.`,
      },
    }
  }

  const budgetValue = typeof body.budget === 'string' ? body.budget : 'Flexible'
  const priorityValue = typeof body.priority === 'string' ? body.priority : 'Balanced'

  if (budgetValue && !VALID_BUDGETS.includes(budgetValue as ResearchBudget)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_BUDGET',
        message: 'Budget preference is invalid.',
      },
    }
  }

  if (priorityValue && !VALID_PRIORITIES.includes(priorityValue as ResearchPriority)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PRIORITY',
        message: 'Priority preference is invalid.',
      },
    }
  }

  return {
    ok: true,
    value: {
      query,
      budget: budgetValue,
      priority: priorityValue,
    },
  }
}

export function normalizeTavilyResults(payload: unknown): ResearchResultItem[] {
  const list = Array.isArray(payload) ? payload : Array.isArray((payload as { results?: unknown })?.results) ? (payload as { results: unknown[] }).results : []

  return list
    .map((entry) => {
      const item = entry as Record<string, unknown>
      const rawUrl = typeof item.url === 'string' ? item.url : ''
      const title = sanitizeText(item.title, 'Untitled result')
      const snippet = sanitizeText(item.content ?? item.snippet ?? item.summary ?? item.description, 'No summary available.', MAX_SNIPPET_LENGTH)

      if (!rawUrl || !isValidHttpUrl(rawUrl)) {
        return null
      }

      const source = typeof item.source === 'string' ? item.source : undefined
      const sourceType = typeof item.source_type === 'string' ? item.source_type : undefined
      const publishedDate = typeof item.published_date === 'string' ? item.published_date : undefined

      return {
        title,
        url: rawUrl,
        snippet,
        source,
        sourceType,
        publishedDate,
      }
    })
    .filter((item): item is ResearchResultItem => item !== null)
    .slice(0, MAX_RESULTS)
}

export function buildResearchResponse(
  query: string,
  results: ResearchResultItem[],
  preferences: ResearchPreferences,
): ResearchResponse {
  return {
    query,
    results,
    totalResults: results.length,
    provider: 'tavily',
    generatedAt: new Date().toISOString(),
    warnings: [
      'This is live search output, not a verified recommendation or ranked shortlist.',
    ],
    isDemo: false,
    preferences,
  }
}

export function createApiError(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  }
}
