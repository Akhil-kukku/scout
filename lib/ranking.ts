import type { ResearchBudget, ResearchPreferences, ResearchPriority, ResearchResultItem } from './research'

export const TRACKING_QUERY_PARAMS = new Set([
  // UTM parameters
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_reader',
  'utm_referrer',
  'utm_name',
  'utm_cid',
  'utm_swu',

  // Ad & click identifiers
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'twclid',
  'yclid',
  'wbraid',
  'gbraid',
  'li_fat_id',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',

  // Analytics & session identifiers
  '_ga',
  '_gl',
  '_openstat',
  'session_id',
  'sid',

  // Referral / UI / Sharing tracking
  'ref',
  'ref_',
  'ref_src',
  'ref_url',
  'referrer',
  'feature',
  'ved',
  'ei',
  'usg',
  'sr_share',
  'trk',
  'trk_campaign',
  'ns_mchannel',
  'ns_source',
  'ns_campaign',
  'ns_linkname',
  'ns_fee',
])

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
])

const PRIORITY_SIGNALS: Record<ResearchPriority, string[]> = {
  Balanced: [],
  'Best quality': [
    'best', 'premium', 'high-end', 'top-rated', 'flagship', 'superior',
    'audiophile', 'pro', 'highest quality', 'top pick', 'overall best',
  ],
  'Best value': [
    'value', 'bang for the buck', 'affordable', 'budget', 'worth it',
    'value for money', 'economical', 'price to performance',
  ],
  'Reliability first': [
    'reliable', 'reliability', 'durable', 'durability', 'long-lasting',
    'warranty', 'tested', 'build quality', 'sturdy', 'robust',
  ],
  'Comfort and ease': [
    'comfort', 'comfortable', 'ergonomic', 'ease of use', 'easy to use',
    'lightweight', 'intuitive', 'convenient', 'all-day',
  ],
}

/**
 * Normalizes a URL for deduplication while preserving identity-defining parameters and paths.
 * Strips tracking query parameters, hashes/fragments, redundant slashes, and default ports.
 * Preserves casing of path and meaningful query values for case-sensitive endpoints.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)

    const protocol =
      parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? 'https:'
        : parsed.protocol.toLowerCase()

    let hostname = parsed.hostname.toLowerCase().replace(/\.+$/, '')
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }

    const port =
      parsed.port === '80' || parsed.port === '443' || !parsed.port
        ? ''
        : `:${parsed.port}`

    let pathname = parsed.pathname.replace(/\/+/g, '/')
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    const cleanParams: [string, string][] = []
    parsed.searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (!TRACKING_QUERY_PARAMS.has(lowerKey) && !lowerKey.startsWith('utm_')) {
        cleanParams.push([key, value])
      }
    })

    cleanParams.sort(([k1, v1], [k2, v2]) => {
      const cmp = k1.localeCompare(k2)
      return cmp !== 0 ? cmp : v1.localeCompare(v2)
    })

    const search =
      cleanParams.length > 0
        ? '?' +
          cleanParams
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&')
        : ''

    return `${protocol}//${hostname}${port}${pathname}${search}`
  } catch {
    return rawUrl.trim().toLowerCase()
  }
}

/**
 * Extracts a normalized domain/host for source diversity calculations.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    let hostname = parsed.hostname.toLowerCase().replace(/\.+$/, '')
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }
    return hostname
  } catch {
    return 'unknown'
  }
}

/**
 * Selects the higher quality item when two search results share the same normalized URL.
 */
function selectBetterItem(
  existing: ResearchResultItem,
  candidate: ResearchResultItem,
): ResearchResultItem {
  const existingScore = existing.score ?? 0
  const candidateScore = candidate.score ?? 0
  if (candidateScore > existingScore) return candidate
  if (existingScore > candidateScore) return existing

  const existingLen = (existing.title || '').length + (existing.snippet || '').length
  const candidateLen = (candidate.title || '').length + (candidate.snippet || '').length
  if (candidateLen > existingLen) return candidate

  return existing
}

/**
 * Deduplicates a list of search result items based on normalized URLs.
 * Retains original source URLs on the kept item.
 */
export function deduplicateResults(items: ResearchResultItem[]): ResearchResultItem[] {
  if (!Array.isArray(items) || items.length === 0) return []

  const seenMap = new Map<string, { item: ResearchResultItem; firstIndex: number }>()
  const orderedKeys: string[] = []

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || !item.url) return
    const key = normalizeUrl(item.url)
    const existing = seenMap.get(key)
    if (!existing) {
      seenMap.set(key, { item, firstIndex: index })
      orderedKeys.push(key)
    } else {
      const better = selectBetterItem(existing.item, item)
      seenMap.set(key, { item: better, firstIndex: existing.firstIndex })
    }
  })

  return orderedKeys.map((k) => seenMap.get(k)!.item)
}

/**
 * Tokenizes a query into normalized lowercase terms, removing stop words.
 */
export function tokenizeQuery(query: string): string[] {
  if (typeof query !== 'string') return []
  const normalized = query.toLowerCase()
  const rawTokens = normalized
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const filtered = rawTokens.filter((token) => !STOP_WORDS.has(token) && token.length > 1)
  return filtered.length > 0 ? filtered : rawTokens
}

/**
 * Evaluates recency bonus from publishedDate metadata if available.
 */
function getRecencyScore(publishedDate?: string): number {
  if (!publishedDate) return 0.02
  try {
    const date = new Date(publishedDate)
    const time = date.getTime()
    if (Number.isNaN(time)) return 0.02
    const now = Date.now()
    const ageDays = (now - time) / (1000 * 60 * 60 * 24)
    if (ageDays < 0) return 0.03
    if (ageDays <= 365) return 0.05
    if (ageDays <= 365 * 3) return 0.03
    return 0.01
  } catch {
    return 0.02
  }
}

/**
 * Evaluates defensible budget alignment based on available text mentions.
 * Never treats a budget mention as absolute verification of individual product price.
 */
function getBudgetScore(text: string, budget?: ResearchBudget): number {
  if (!budget || budget === 'Flexible') return 0

  const lower = text.toLowerCase().replace(/,/g, '')
  const budgetMatch = budget.match(/\d[\d,]*/)
  if (!budgetMatch) return 0
  const budgetNumberStr = budgetMatch[0].replace(/,/g, '')

  const directRegex = new RegExp(
    `(?:under|below|less than|within)\\s*(?:₹|rs\\.?|inr)?\\s*${budgetNumberStr}`,
    'i',
  )
  if (directRegex.test(lower)) {
    return 0.05
  }

  if (/(?:budget|affordable|cheap|economy|entry-level)/i.test(lower)) {
    return 0.02
  }

  return 0
}

/**
 * Evaluates subtle priority alignment based on relevant keyword matches.
 */
function getPriorityScore(text: string, priority?: ResearchPriority): number {
  if (!priority || priority === 'Balanced') return 0

  const keywords = PRIORITY_SIGNALS[priority]
  if (!keywords || keywords.length === 0) return 0

  const lower = text.toLowerCase()
  let matches = 0
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      matches++
    }
  }

  if (matches >= 2) return 0.05
  if (matches === 1) return 0.03
  return 0
}

/**
 * Calculates a defensible, deterministic relevance score for a search result item.
 */
export function calculateRelevanceScore(
  item: ResearchResultItem,
  query: string,
  preferences?: Partial<ResearchPreferences>,
): number {
  if (!item) return 0

  const title = (item.title || '').trim()
  const snippet = (item.snippet || '').trim()
  const lowerTitle = title.toLowerCase()
  const lowerSnippet = snippet.toLowerCase()
  const combinedText = `${lowerTitle} ${lowerSnippet}`

  // Normalize punctuation to spaces for robust phrase and token matching (e.g. noise-cancelling matches noise cancelling)
  const normTitle = ` ${lowerTitle.replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  const normSnippet = ` ${lowerSnippet.replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  const cleanQuery = (query || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
  const tokens = tokenizeQuery(query)

  // 1. Exact query match bonus
  let exactMatchScore = 0
  if (cleanQuery.length > 2) {
    if (normTitle.includes(` ${cleanQuery} `) || normTitle.includes(cleanQuery)) {
      exactMatchScore += 0.2
    } else if (normSnippet.includes(` ${cleanQuery} `) || normSnippet.includes(cleanQuery)) {
      exactMatchScore += 0.1
    }
  }

  // 2. Query token coverage in title and snippet
  let titleMatches = 0
  let snippetMatches = 0
  if (tokens.length > 0) {
    for (const token of tokens) {
      if (normTitle.includes(token)) titleMatches++
      if (normSnippet.includes(token)) snippetMatches++
    }
  }
  const titleCoverage = tokens.length > 0 ? titleMatches / tokens.length : 0
  const snippetCoverage = tokens.length > 0 ? snippetMatches / tokens.length : 0

  // 3. Tavily upstream score integration (or neutral fallback if absent)
  const tavilyRaw = typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : 0.5
  const normalizedTavily = Math.max(0, Math.min(1, tavilyRaw))

  // 4. Source metadata & content quality
  const recencyScore = getRecencyScore(item.publishedDate)
  const substanceScore = snippet.length >= 80 && title.length >= 5 ? 0.03 : 0.01

  // 5. Budget and priority signals (carefully bounded)
  const budgetScore = getBudgetScore(combinedText, preferences?.budget)
  const priorityScore = getPriorityScore(combinedText, preferences?.priority)

  // Composite score calculation
  const composite =
    exactMatchScore +
    titleCoverage * 0.35 +
    snippetCoverage * 0.2 +
    normalizedTavily * 0.2 +
    recencyScore +
    substanceScore +
    budgetScore +
    priorityScore

  return Math.round(composite * 10000) / 10000
}

/**
 * Simple relevance gate to filter out results with insufficient token overlap
 * or lacking budget relevance. Returns true if the item is considered relevant.
 */
function passesRelevanceGate(
  item: ResearchResultItem,
  query: string,
  preferences?: Partial<ResearchPreferences>,
): boolean {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true; // nothing to match against

  const title = (item.title || '').toLowerCase();
  const snippet = (item.snippet || '').toLowerCase();
  const combined = `${title} ${snippet}`;

  let matches = 0;
  for (const token of tokens) {
    if (combined.includes(token)) matches++;
  }
  const coverage = matches / tokens.length;

  // Require at least 30% token coverage. If a budget is specified, we allow a budget match *only* when there is some token overlap.
  if (coverage >= 0.3) return true;
  if (preferences?.budget && preferences.budget !== 'Flexible') {
    const budgetScore = getBudgetScore(combined, preferences.budget);
    if (budgetScore > 0 && coverage > 0) return true;
  }
  return false;
}

/**
 * Deduplicates and ranks search results using query relevance, source diversity,
 * and deterministic stable tie-breaking.
 */
export function rankAndDeduplicateResults(
  items: ResearchResultItem[],
  query: string,
  preferences?: Partial<ResearchPreferences>,
  maxResults = 8,
): ResearchResultItem[] {
  if (!Array.isArray(items) || items.length === 0) return []

  // 1️⃣ Filter out malformed items before relevance gate.
  const sanitized = items.filter((it): it is ResearchResultItem => {
    if (it == null || typeof it !== 'object') return false;
    const partial = it as Partial<ResearchResultItem>;
    return (
      typeof partial.title === 'string' &&
      typeof partial.url === 'string' &&
      typeof partial.snippet === 'string'
    );
  });

  // 2️⃣ Apply relevance gate early – drop low‑relevance candidates.
  const gatedItems = sanitized.filter((it) => passesRelevanceGate(it, query, preferences));
  if (gatedItems.length === 0) return [];

  // 3️⃣ Deduplicate the remaining items.
  const deduped = deduplicateResults(gatedItems);
  if (deduped.length === 0) return [];

  // 3️⃣ Score each deduped candidate.
  interface ScoredCandidate {
    item: ResearchResultItem
    baseScore: number
    domain: string
    originalIndex: number
  }

  const candidates: ScoredCandidate[] = deduped.map((item, index) => ({
    item,
    baseScore: calculateRelevanceScore(item, query, preferences),
    domain: extractDomain(item.url),
    originalIndex: index,
  }))

  // 4️⃣ Apply source‑diversity selection.
  const selected: ResearchResultItem[] = []
  const domainCounts = new Map<string, number>()
  const remaining = [...candidates]
  const targetCount = Math.min(maxResults, remaining.length)

  while (selected.length < targetCount && remaining.length > 0) {
    let bestIdx = 0
    let bestEffectiveScore = -Infinity

    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i]
      const count = domainCounts.get(cand.domain) ?? 0
      const diversityMultiplier =
        count === 0 ? 1.0 : count === 1 ? 0.78 : count === 2 ? 0.6 : 0.45
      const effectiveScore = cand.baseScore * diversityMultiplier

      if (effectiveScore > bestEffectiveScore + 1e-6) {
        bestEffectiveScore = effectiveScore
        bestIdx = i
      } else if (Math.abs(effectiveScore - bestEffectiveScore) <= 1e-6) {
        // Stable tie‑breaker: keep the earlier arrival order.
        if (cand.originalIndex < remaining[bestIdx].originalIndex) {
          bestEffectiveScore = effectiveScore
          bestIdx = i
        }
      }
    }

    const [chosen] = remaining.splice(bestIdx, 1)
    selected.push(chosen.item)
    domainCounts.set(chosen.domain, (domainCounts.get(chosen.domain) ?? 0) + 1)
  }

  return selected
}
