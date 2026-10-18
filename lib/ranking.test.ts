import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateRelevanceScore,
  deduplicateResults,
  extractDomain,
  normalizeUrl,
  rankAndDeduplicateResults,
} from './ranking'
import type { ResearchResultItem } from './research'

test('normalizeUrl strips tracking parameters, fragments, and www', () => {
  const url1 = 'https://www.Example.COM/review/keyboard?utm_source=twitter&utm_medium=social#section2'
  const url2 = 'http://example.com/review/keyboard/?fbclid=IwAR123'
  const url3 = 'https://example.com/review/keyboard'

  assert.equal(normalizeUrl(url1), 'https://example.com/review/keyboard')
  assert.equal(normalizeUrl(url2), 'https://example.com/review/keyboard')
  assert.equal(normalizeUrl(url3), 'https://example.com/review/keyboard')
})

test('extractDomain extracts clean hostnames and handles invalid URLs', () => {
  assert.equal(extractDomain('https://www.theverge.com/reviews/1'), 'theverge.com')
  assert.equal(extractDomain('http://Sub.Example.org/path'), 'sub.example.org')
  assert.equal(extractDomain('not-a-url'), 'unknown')
})

test('normalizeUrl preserves distinct resource query parameters and distinct paths', () => {
  const productA = 'https://example.com/item?id=101&utm_campaign=spring'
  const productB = 'https://example.com/item?id=102'
  const articleA = 'https://example.com/blog/keyboard-a'
  const articleB = 'https://example.com/blog/keyboard-b'

  assert.notEqual(normalizeUrl(productA), normalizeUrl(productB))
  assert.equal(normalizeUrl(productA), 'https://example.com/item?id=101')
  assert.equal(normalizeUrl(productB), 'https://example.com/item?id=102')

  assert.notEqual(normalizeUrl(articleA), normalizeUrl(articleB))
})

test('normalizeUrl safely handles malformed URLs', () => {
  assert.equal(normalizeUrl('not-a-valid-url'), 'not-a-valid-url')
  assert.equal(normalizeUrl(''), '')
})

test('deduplicateResults collapses duplicate URL variants and retains valid original URLs', () => {
  const originalUrlWithTracking = 'https://www.example.com/headphones?utm_source=google#specs'
  const duplicateUrlClean = 'https://example.com/headphones'

  const items: ResearchResultItem[] = [
    {
      title: 'Headphones Guide',
      url: originalUrlWithTracking,
      snippet: 'Short snippet.',
    },
    {
      title: 'The Complete Headphones Guide 2026',
      url: duplicateUrlClean,
      snippet: 'A much more detailed and comprehensive snippet with useful research data.',
      score: 0.95,
    },
  ]

  const deduped = deduplicateResults(items)
  assert.equal(deduped.length, 1)
  // Higher quality candidate chosen
  assert.equal(deduped[0].title, 'The Complete Headphones Guide 2026')
  assert.equal(deduped[0].score, 0.95)
  assert.equal(deduped[0].url, duplicateUrlClean)
})

test('deduplicateResults preserves genuinely distinct items', () => {
  const items: ResearchResultItem[] = [
    { title: 'Keyboard One', url: 'https://example.com/keyboards/1', snippet: 'Review one.' },
    { title: 'Keyboard Two', url: 'https://example.com/keyboards/2', snippet: 'Review two.' },
    { title: 'Keyboard Three', url: 'https://example.com/keyboards?p=3', snippet: 'Review three.' },
  ]

  const deduped = deduplicateResults(items)
  assert.equal(deduped.length, 3)
})

test('rankAndDeduplicateResults handles empty and malformed input safely', () => {
  assert.deepEqual(rankAndDeduplicateResults([], 'wireless earphones'), [])
  assert.deepEqual(rankAndDeduplicateResults([] as ResearchResultItem[], ''), [])

  const malformedItems = [
    null as unknown as ResearchResultItem,
    undefined as unknown as ResearchResultItem,
    { title: '', url: '', snippet: '' },
    { title: 'Valid Result', url: 'https://example.com/valid', snippet: 'Valid content.' },
  ]

  const ranked = rankAndDeduplicateResults(malformedItems, 'valid')
  assert.equal(ranked.length, 1)
  assert.equal(ranked[0].title, 'Valid Result')
})

test('rankAndDeduplicateResults ranks relevant results above irrelevant results', () => {
  const query = 'quiet mechanical keyboard office typing'

  const relevantItem: ResearchResultItem = {
    title: 'The Best Quiet Mechanical Keyboards for Office Typing',
    url: 'https://techreview.com/quiet-mechanical-keyboards',
    snippet: 'Looking for a quiet mechanical keyboard for the office? We tested switches suitable for shared workspaces.',
    score: 0.88,
  }

  const irrelevantItem: ResearchResultItem = {
    title: 'Top 10 Chocolate Chip Cookie Recipes',
    url: 'https://baking.com/best-cookies',
    snippet: 'Discover the secret to chewy, delicious cookies baked with pure butter and chocolate.',
    score: 0.12,
  }

  const results = rankAndDeduplicateResults([irrelevantItem, relevantItem], query)

  assert.equal(results.length, 1)
  assert.equal(results[0].title, relevantItem.title)
})

test('rankAndDeduplicateResults handles missing metadata gracefully without error', () => {
  const query = 'standing desk converter'

  const itemWithoutMetadata: ResearchResultItem = {
    title: 'Standing Desk Converter Overview',
    url: 'https://example.org/standing-desks',
    snippet: 'A simple comparison of standing desk converters for home offices.',
    // score, publishedDate, source, sourceType omitted
  }

  const score = calculateRelevanceScore(itemWithoutMetadata, query)
  assert.ok(Number.isFinite(score))
  assert.ok(score > 0)

  const ranked = rankAndDeduplicateResults([itemWithoutMetadata], query)
  assert.equal(ranked.length, 1)
  assert.equal(ranked[0].url, 'https://example.org/standing-desks')
})

test('rankAndDeduplicateResults provides stable deterministic ordering for tied scores', () => {
  const query = 'ergonomic mouse'

  const item1: ResearchResultItem = {
    title: 'Ergonomic Mouse Review',
    url: 'https://site-a.com/mouse',
    snippet: 'Detailed look at ergonomic mice for wrist comfort.',
    score: 0.75,
  }

  const item2: ResearchResultItem = {
    title: 'Ergonomic Mouse Review',
    url: 'https://site-b.com/mouse',
    snippet: 'Detailed look at ergonomic mice for wrist comfort.',
    score: 0.75,
  }

  const order1 = rankAndDeduplicateResults([item1, item2], query)
  assert.equal(order1[0].url, 'https://site-a.com/mouse')
  assert.equal(order1[1].url, 'https://site-b.com/mouse')

  const order2 = rankAndDeduplicateResults([item2, item1], query)
  assert.equal(order2[0].url, 'https://site-b.com/mouse')
  assert.equal(order2[1].url, 'https://site-a.com/mouse')
})

test('rankAndDeduplicateResults applies source diversity to prevent single-domain saturation', () => {
  const query = 'best noise cancelling headphones'

  const reddit1: ResearchResultItem = {
    title: 'Best noise cancelling headphones thread 1',
    url: 'https://reddit.com/r/headphones/thread1',
    snippet: 'Community discussions on best noise cancelling headphones.',
    score: 0.85,
  }
  const reddit2: ResearchResultItem = {
    title: 'Best noise cancelling headphones thread 2',
    url: 'https://reddit.com/r/headphones/thread2',
    snippet: 'More discussions on best noise cancelling headphones options.',
    score: 0.84,
  }
  const nytimes: ResearchResultItem = {
    title: 'The Best Noise-Cancelling Headphones of 2026',
    url: 'https://nytimes.com/wirecutter/noise-cancelling-headphones',
    snippet: 'Extensive lab testing of top noise cancelling headphones.',
    score: 0.83,
  }

  // Without diversity, reddit1 and reddit2 would occupy positions 0 and 1.
  // With diversity re-ranking, nytimes is promoted ahead of reddit2.
  const ranked = rankAndDeduplicateResults([reddit1, reddit2, nytimes], query, undefined, 3)

  assert.equal(ranked[0].url, reddit1.url)
  assert.equal(ranked[1].url, nytimes.url)
  assert.equal(ranked[2].url, reddit2.url)
})

test('rankAndDeduplicateResults applies defensible budget signals when relevant', () => {
  const query = 'wireless earbuds'

  const budgetItem: ResearchResultItem = {
    title: 'Top Wireless Earbuds Under ₹5,000 in India',
    url: 'https://audio.in/budget-earbuds',
    snippet: 'Comprehensive guide to the best wireless earbuds under ₹5,000 for value seekers.',
    score: 0.7,
  }

  const luxuryItem: ResearchResultItem = {
    title: 'High-End Luxury Wireless Earbuds for Daily Music',
    url: 'https://audiophile.com/flagship-earbuds',
    snippet: 'Comprehensive guide to the best wireless earbuds priced at ₹45,000 for audiophiles.',
    score: 0.7,
  }

  // When Under ₹5,000 is requested, budgetItem gets a defensible boost
  const rankedBudget = rankAndDeduplicateResults(
    [luxuryItem, budgetItem],
    query,
    { budget: 'Under ₹5,000', priority: 'Balanced' },
  )
  assert.equal(rankedBudget[0].url, budgetItem.url)

  // When Flexible is requested, no budget boost is applied
  const rankedFlexible = rankAndDeduplicateResults(
    [luxuryItem, budgetItem],
    query,
    { budget: 'Flexible', priority: 'Balanced' },
  )
  // Scores tied, original arrival order preserved
  assert.equal(rankedFlexible[0].url, luxuryItem.url)
})

test('rankAndDeduplicateResults applies defensible priority signals', () => {
  const query = 'office chair'

  const comfortItem: ResearchResultItem = {
    title: 'Ergonomic Office Chair with Lumbar Support',
    url: 'https://ergolife.com/chair',
    snippet: 'Engineered for all-day comfort, ergonomic support, and easy adjustments.',
    score: 0.7,
  }

  const valueItem: ResearchResultItem = {
    title: 'Best Value Office Chair for Home Desks',
    url: 'https://valuereviews.com/chair',
    snippet: 'A budget-friendly pick offering tremendous value for money.',
    score: 0.7,
  }

  const rankedComfort = rankAndDeduplicateResults(
    [valueItem, comfortItem],
    query,
    { priority: 'Comfort and ease', budget: 'Flexible' },
  )
  assert.equal(rankedComfort[0].url, comfortItem.url)

  const rankedValue = rankAndDeduplicateResults(
    [comfortItem, valueItem],
    query,
    { priority: 'Best value', budget: 'Flexible' },
  )
  assert.equal(rankedValue[0].url, valueItem.url)
})

test('rankAndDeduplicateResults preserves original source URLs in output', () => {
  const query = 'travel backpack'
  const originalUrl = 'https://www.traveler.com/bags/pack-1?ref=newsletter_2026#specs'

  const item: ResearchResultItem = {
    title: 'The Best Travel Backpack',
    url: originalUrl,
    snippet: 'Tested travel backpack durable for flights.',
  }

  const results = rankAndDeduplicateResults([item], query)
  assert.equal(results.length, 1)
  assert.equal(results[0].url, originalUrl)
})
// Additional regression tests for relevance gate and edge cases

test('budget term alone does not pass relevance gate', () => {
  const query = 'wireless earbuds under ₹3,000';
  const travelItem = {
    title: 'Travel Carry‑on Luggage Review',
    url: 'https://travel.com/luggage',
    snippet: 'A budget-friendly carry‑on suitcase for frequent flyers.',
    score: 0.9,
  } as ResearchResultItem;
  const results = rankAndDeduplicateResults([travelItem], query, { budget: 'Under ₹5,000', priority: 'Balanced' });
  assert.equal(results.length, 0);
});

test('relevant result without Tavily score is retained', () => {
  const query = 'wireless earbuds';
  const item = {
    title: 'Best Wireless Earbuds Under ₹3,000',
    url: 'https://audio.com/earbuds',
    snippet: 'These earbuds offer great sound under the budget.',
    // no score property
  } as ResearchResultItem;
  const results = rankAndDeduplicateResults([item], query);
  assert.equal(results.length, 1);
  assert.equal(results[0].url, item.url);
});

test('returns fewer than maxResults when only few items pass relevance', () => {
  const query = 'wireless earbuds';
  const relevant = {
    title: 'Earbuds under ₹3,000',
    url: 'https://audio.com/earbuds1',
    snippet: 'Affordable earbuds.',
    score: 0.8,
  } as ResearchResultItem;
  const irrelevant = {
    title: 'Travel Luggage',
    url: 'https://travel.com/luggage',
    snippet: 'Budget-friendly carry‑on.',
    score: 0.9,
  } as ResearchResultItem;
  const results = rankAndDeduplicateResults([relevant, irrelevant], query, { budget: 'Under ₹5,000', priority: 'Balanced' }, 5);
  assert.equal(results.length, 1);
  assert.equal(results[0].url, relevant.url);
});
