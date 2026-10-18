'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CornerDownLeft,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ResearchResultItem } from '@/lib/research'

const categories = [
  { label: 'Earphones', icon: '◒', query: 'What are the best wireless earphones for long flights under $250?' },
  { label: 'Fragrances', icon: '✳', query: 'Find a subtle, woody fragrance for everyday wear that lasts.' },
  { label: 'Keyboards', icon: '⌘', query: 'Compare the best mechanical keyboards for quiet office typing.' },
  { label: 'Anything else', icon: '⊹', query: 'What should I know before choosing a standing desk?' },
]

const examples = [
  { number: '01', eyebrow: 'Audio / live search', title: 'The best wireless earphones for long flights', meta: 'A considered shortlist for comfort, battery life, and calm.', tone: 'olive' },
  { number: '02', eyebrow: 'Home office / live search', title: 'A quiet mechanical keyboard that feels good all day', meta: 'Switches, sound, and the small details that matter.', tone: 'sand' },
  { number: '03', eyebrow: 'Travel / live search', title: 'A carry-on that earns its place', meta: 'Durability, dimensions, and whether it really fits.', tone: 'ink' },
]

const phases = ['Submitting your request', 'Searching the web', 'Processing source results', 'Displaying results']

export default function Page() {
  const [query, setQuery] = useState('')
  const [researching, setResearching] = useState(false)
  const [phase, setPhase] = useState(0)
  const [showPreferences, setShowPreferences] = useState(false)
  const [budget, setBudget] = useState('Flexible')
  const [priority, setPriority] = useState('Balanced')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<ResearchResultItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const resetComposer = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setResearching(false)
    setShowResults(false)
    setResults([])
    setError(null)
    setPhase(0)
  }

  const submit = async () => {
    const trimmed = query.trim()
    if (!trimmed || researching) {
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setResearching(true)
    setShowResults(false)
    setError(null)
    setPhase(1)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
          budget,
          priority,
        }),
        signal: controller.signal,
      })

      const payload = (await response.json()) as {
        results?: ResearchResultItem[]
        error?: { message?: string }
      }

      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Search request failed.')
      }

      setResults(payload.results ?? [])
      setPhase(3)
      setShowResults(true)
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        setResearching(false)
        setShowResults(false)
        setPhase(0)
        return
      }

      setError(err instanceof Error ? err.message : 'The research request failed.')
      setShowResults(false)
      setResearching(false)
      setPhase(0)
      return
    } finally {
      if (!controller.signal.aborted) {
        setResearching(false)
        abortRef.current = null
      }
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f4ef] text-[#171814] selection:bg-[#d8e85a] selection:text-[#171814]">
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <a href="#top" className="flex items-center gap-2.5" aria-label="SCOUT home">
          <span className="grid size-7 place-items-center rounded-[7px] bg-[#171814] text-[#d8e85a]">
            <Target className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.03em]">SCOUT</span>
        </a>
        <div className="hidden items-center gap-9 text-[13px] font-medium text-[#696b61] sm:flex">
          <a className="transition-colors hover:text-[#171814]" href="#discover">
            Discover
          </a>
          <a className="transition-colors hover:text-[#171814]" href="#how-it-works">
            How it works
          </a>
        </div>
        <Button
          onClick={() => document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })}
          className="h-9 rounded-full bg-[#171814] px-4 text-xs text-[#f5f4ef] hover:bg-[#34372d]"
        >
          Start researching <ArrowUpRight data-icon="inline-end" />
        </Button>
      </nav>

      <section
        id="top"
        className="mx-auto max-w-[1240px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-32 lg:pt-32"
      >
        <div className="max-w-[800px]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#7d805f]"
          >
            <span className="size-1.5 rounded-full bg-[#a8be32]" /> Research, without the rabbit hole
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="max-w-[760px] text-[clamp(3.3rem,8vw,7.4rem)] font-medium leading-[.91] tracking-[-.085em]"
          >
            Find your best.
            <br />
            <span className="text-[#929b68]">Skip the rabbit hole.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 max-w-[510px] text-[16px] leading-7 text-[#686b61] sm:text-[18px]"
          >
            SCOUT is a team of research agents that investigates, verifies, and compares the things
            you&apos;re considering — so you can choose with confidence.
          </motion.p>
        </div>

        <motion.div
          id="research"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 max-w-[920px]"
        >
          <AnimatePresence mode="wait">
            {showResults ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#c9c9bd] bg-[#faf9f5] p-5 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#858878]">
                      <Check className="size-3.5" /> Search results
                    </div>
                    <h2 className="max-w-[650px] text-xl leading-7 tracking-[-.025em] sm:text-2xl">
                      Live search results for your question
                    </h2>
                    <p className="mt-2 max-w-[600px] text-sm leading-6 text-[#686b61]">{query}</p>
                  </div>
                  <button
                    onClick={resetComposer}
                    className="text-xs text-[#77796e] underline underline-offset-4"
                  >
                    New search
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-[#e2d7b8] bg-[#f6f0df] p-3 text-xs leading-5 text-[#6f6243]">
                  This is live search output from Tavily, deduplicated and ranked for query relevance
                  and source diversity. It is not a verified recommendation or ranked shortlist.
                  Preferences: {budget} · {priority}.
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-[#e5c6a6] bg-[#f9eedf] p-3 text-xs leading-5 text-[#724d1d]">
                    {error}
                  </div>
                )}

                {results.length === 0 ? (
                  <div className="mt-5 rounded-xl border border-[#e3e2da] bg-[#f5f4ef] p-4 text-sm leading-6 text-[#686b61]">
                    No results were returned for this query. Try a broader question or a different
                    phrasing.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {results.map((item, index) => {
                      const host = (() => {
                        try {
                          return new URL(item.url).hostname.replace(/^www\./, '')
                        } catch {
                          return 'source'
                        }
                      })()

                      return (
                        <a
                          key={`${item.url}-${index}`}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex gap-4 rounded-xl border border-[#e3e2da] p-4 transition-colors hover:bg-[#f9f8f4]"
                        >
                          <span className="font-mono text-xs text-[#929b68]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-[#171814]">{item.title}</h3>
                              <span className="rounded-full bg-[#eeeee7] px-2 py-1 text-[10px] text-[#77796e]">
                                {host}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-[#77796e]">{item.snippet}</p>
                            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#171814]">
                              Open source <ArrowUpRight className="size-3.5" />
                            </span>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                )}

                <Button
                  onClick={() => {
                    resetComposer()
                    document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="mt-5 h-9 rounded-full bg-[#171814] px-4 text-xs text-[#f5f4ef] hover:bg-[#34372d]"
                >
                  Start a new search <ArrowUpRight data-icon="inline-end" />
                </Button>
              </motion.div>
            ) : researching ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#c9c9bd] bg-[#faf9f5] p-5 sm:p-8"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#858878]">
                  <Loader2 className="size-3.5 animate-spin" /> {phases[phase]}
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="h-2 overflow-hidden rounded-full bg-[#eceae2]">
                    <div
                      className="h-full rounded-full bg-[#a8be32] transition-all duration-300"
                      style={{ width: `${((phase + 1) / phases.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm leading-6 text-[#686b61]">
                    Searching the web and preparing results for “{query}”.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="composer"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="relative rounded-2xl border border-[#c9c9bd] bg-[#faf9f5] p-4 shadow-[0_20px_60px_-40px_rgba(23,24,20,.4)] sm:p-5"
              >
                <label htmlFor="research-query" className="sr-only">
                  What do you want to research?
                </label>
                <textarea
                  id="research-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing &&
                      event.keyCode !== 229
                    ) {
                      event.preventDefault()
                      void submit()
                    }
                  }}
                  placeholder="What are you looking for?"
                  rows={3}
                  className="w-full resize-none bg-transparent px-1 py-1 text-[20px] leading-8 tracking-[-.025em] outline-none placeholder:text-[#9a9c91] sm:text-[23px]"
                />
                <div className="mt-4 flex items-center justify-between border-t border-[#e3e2da] pt-3">
                  <button
                    aria-expanded={showPreferences}
                    aria-controls="research-preferences"
                    className="flex items-center gap-2 text-xs text-[#7d7f75] transition-colors hover:text-[#171814]"
                    type="button"
                    onClick={() => setShowPreferences((open) => !open)}
                  >
                    <Sparkles className="size-3.5" />{' '}
                    {showPreferences ? 'Hide preferences' : 'Add preferences'}{' '}
                    <span className="rounded border border-[#d7d7ca] px-1.5 py-0.5 text-[10px]">
                      optional
                    </span>
                  </button>
                  <Button
                    aria-label="Start research"
                    onClick={() => void submit()}
                    disabled={!query.trim() || researching}
                    className="size-10 rounded-xl bg-[#a8be32] p-0 text-[#171814] hover:bg-[#b9cf43] disabled:bg-[#e1e2d7]"
                  >
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                </div>
                {showPreferences && (
                  <div
                    id="research-preferences"
                    className="mt-4 grid gap-4 border-t border-[#e3e2da] pt-4 sm:grid-cols-2"
                  >
                    <label className="grid gap-1.5 text-xs font-medium text-[#686b61]">
                      Budget
                      <select
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        className="h-10 rounded-lg border border-[#d7d7ca] bg-[#f5f4ef] px-3 text-sm text-[#171814] outline-none focus:ring-2 focus:ring-[#a8be32]"
                      >
                        <option>Flexible</option>
                        <option>Under ₹2,000</option>
                        <option>Under ₹5,000</option>
                        <option>Under ₹10,000</option>
                        <option>Under ₹25,000</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-medium text-[#686b61]">
                      What matters most?
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className="h-10 rounded-lg border border-[#d7d7ca] bg-[#f5f4ef] px-3 text-sm text-[#171814] outline-none focus:ring-2 focus:ring-[#a8be32]"
                      >
                        <option>Balanced</option>
                        <option>Best quality</option>
                        <option>Best value</option>
                        <option>Reliability first</option>
                        <option>Comfort and ease</option>
                      </select>
                    </label>
                  </div>
                )}
                {error && (
                  <div className="mt-4 rounded-xl border border-[#e5c6a6] bg-[#f9eedf] p-3 text-xs leading-5 text-[#724d1d]">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {!researching && !showResults && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#85877b]">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="size-3" /> Enter to research
              </span>
              <span className="hidden sm:inline">·</span>
              <span>Shift + Enter for a new line</span>
            </div>
          )}
        </motion.div>
      </section>

      <section id="discover" className="border-y border-[#d9d9cf] bg-[#eeeee7]">
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#858878]">
                Start somewhere
              </p>
              <h2 className="text-2xl tracking-[-.04em] sm:text-3xl">A better way to browse.</h2>
            </div>
            <span className="hidden text-xs text-[#858878] sm:block">
              Popular research paths <ChevronRight className="ml-1 inline size-3" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden border border-[#d4d4c9] bg-[#d4d4c9] sm:grid-cols-4">
            {categories.map((category) => (
              <button
                key={category.label}
                onClick={() => {
                  setQuery(category.query)
                  document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group flex min-h-[132px] flex-col justify-between bg-[#f5f4ef] p-4 text-left transition-colors hover:bg-[#faf9f5] sm:min-h-[164px] sm:p-5"
              >
                <span className="text-2xl text-[#929b68] transition-transform group-hover:scale-110">
                  {category.icon}
                </span>
                <span className="flex items-center justify-between text-sm font-medium">
                  {category.label}
                  <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#858878]">
              Good questions deserve good answers
            </p>
            <h2 className="max-w-[500px] text-3xl leading-tight tracking-[-.05em] sm:text-4xl">
              Research you can actually use.
            </h2>
          </div>
          <p className="hidden max-w-[220px] text-right text-sm leading-6 text-[#858878] sm:block">
            Thoughtful starting points for the things that take more than a quick search.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {examples.map((example) => (
            <motion.button
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              key={example.number}
              onClick={() => {
                setQuery(example.title)
                document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl p-5 text-left ${
                example.tone === 'olive'
                  ? 'bg-[#c6d184]'
                  : example.tone === 'sand'
                    ? 'bg-[#ded3b9]'
                    : 'bg-[#282b25] text-[#f5f4ef]'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.16em] opacity-65">
                <span>{example.eyebrow}</span>
                <span>{example.number}</span>
              </div>
              <div>
                <h3 className="max-w-[300px] text-2xl leading-[1.05] tracking-[-.05em] sm:text-[27px]">
                  {example.title}
                </h3>
                <p className="mt-4 max-w-[265px] text-xs leading-5 opacity-65">{example.meta}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold">
                  Explore{' '}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-t border-[#d9d9cf] bg-[#faf9f5]">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#858878]">
                The method
              </p>
              <h2 className="max-w-[320px] text-3xl leading-[1.05] tracking-[-.055em] sm:text-4xl">
                Less noise.
                <br />
                More signal.
              </h2>
              <p className="mt-6 max-w-[290px] text-sm leading-6 text-[#77796e]">
                A small team of agents, each with a very specific job. Together, they turn a messy
                question into a clear next step.
              </p>
            </div>
            <div className="divide-y divide-[#deded5] border-y border-[#deded5]">
              {[
                ['01', 'Investigate', 'Search widely across reviews, guides, forums, and primary sources.'],
                ['02', 'Verify', 'Cross-check the details that separate a confident choice from a guess.'],
                ['03', 'Compare', 'Make the trade-offs visible, so you can decide what matters to you.'],
                ['04', 'Recommend', 'Return a focused shortlist with evidence, context, and a point of view.'],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="grid grid-cols-[38px_1fr] gap-5 py-6 sm:grid-cols-[54px_130px_1fr] sm:items-center"
                >
                  <span className="font-mono text-xs text-[#9a9c91]">{number}</span>
                  <h3 className="text-base font-medium tracking-[-.02em]">{title}</h3>
                  <p className="col-start-2 text-sm leading-6 text-[#77796e] sm:col-start-3">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-8 text-xs text-[#85877b] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-medium text-[#45473f]">
          <span className="grid size-5 place-items-center rounded-[5px] bg-[#171814] text-[#d8e85a]">
            <Target className="size-3" />
          </span>{' '}
          SCOUT
        </div>
        <p>Good research, made simple.</p>
        <div className="flex gap-5">
          <a href="#how-it-works" className="hover:text-[#171814]">
            About
          </a>
          <a href="#research" className="hover:text-[#171814]">
            Start a search
          </a>
        </div>
      </footer>
    </main>
  )
}