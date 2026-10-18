<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# SCOUT — Project Instructions

## Product
SCOUT is an evidence-driven research and recommendation website. It investigates topics, compares options, identifies contradictory evidence, and produces a concise ranked shortlist.

## Preserve the existing product
- Keep the existing v0-generated UI and its visual identity.
- Preserve the warm off-white background, olive accents, editorial typography, spacing, and restrained animations.
- Do not replace the existing homepage with a generic SaaS template.
- Avoid unnecessary dependencies and redesigns.

## Engineering principles
- Inspect existing code before modifying it.
- Follow the existing architecture and conventions.
- Make focused, incremental changes.
- Keep TypeScript strict and build checks enabled.
- Never hardcode API keys or commit secrets.
- Keep external API calls server-side.
- Use environment variables for credentials.
- Add validation, error handling, timeouts, and sensible rate limits.
- Clearly distinguish demo data from real research results.
- Never fabricate citations, source content, verification, or confidence scores.
- Keep the application accessible, responsive, and performant.

## Research quality
- Preserve source URLs and the evidence supporting every material claim.
- Distinguish primary sources, independent testing, community reports, and marketing claims.
- Deduplicate syndicated or repeated information.
- Record contradictory evidence instead of silently discarding it.
- Explain why recommendations rank where they do.
- Do not describe a claim as verified unless the verification process supports that description.
- Prefer a simple, testable workflow before introducing multiple autonomous agents.

## Free-first constraint
- Prioritize free services and free-tier quotas.
- Do not add paid APIs or services without explaining the benefit, alternatives, and expected cost.
- Never allow users to incur unexpected API charges.
- Keep provider integrations replaceable.

## Development workflow
Before implementation:
1. Inspect the repository and current Git status.
2. Explain the proposed changes.
3. Identify affected files and risks.

After implementation:
1. Run available lint, type-check, test, and production-build commands.
2. Fix regressions introduced by the changes.
3. Summarize modified files and actual test results.
4. Identify anything still unverified.

Do not overwrite unrelated work, reset the repository, or push to production without explicit approval.

## Immediate objective
Validate the current deployed frontend, then implement the smallest reliable end-to-end real research workflow while preserving the existing UI.