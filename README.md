# SCOUT

SCOUT is an early-stage research-shortlist prototype. The current interface is built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion, and Lucide.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Current prototype status

- The landing page and category/example interactions are implemented.
- The research progress sequence is simulated.
- The shortlist is illustrative placeholder content, not researched or verified recommendations.
- Preference controls are UI-only and are not connected to a research backend.
- No external search, LLM, persistence, authentication, or agent orchestration is connected yet.

## Next milestones

1. Validate the UI locally and on mobile; fix lint/type/build issues.
2. Create a GitHub repository and deploy the frontend.
3. Design a provider-agnostic research interface and evidence schema.
4. Add a backend with source retrieval, claim provenance, and verification.
5. Replace all demo states with actual backend status and evidence-backed results.
6. Add evaluation tests for citation support, source diversity, and ranking quality.

Keep API keys on the server in environment variables; never expose secrets in client-side code.
