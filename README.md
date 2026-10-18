# SCOUT

SCOUT is an evidence-first research prototype for comparing options and producing a ranked shortlist from real source material.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

This project uses server-only variables for external providers.

```bash
TAVILY_API_KEY=your_tavily_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The API key is read only on the server and must never be exposed to browser code.

## Current status

- The homepage, category prompts, UI styling, and result layout are preserved from the initial v0-generated design.
- The search request is now routed through a server-side endpoint using Tavily.
- Results are returned as source metadata and snippets only.
- The initial version clearly labels results as search output rather than verified recommendations.
- Budget and priority preferences are recorded in the request but are not yet used to rank or filter results.

## API route

A real server-side route is available at:

```text
POST /api/research
```

The route validates the query and preferences, reads TAVILY_API_KEY from the environment, calls Tavily, and returns normalized results.

## Notes

- Search results are not treated as verified recommendations.
- Source URLs are preserved in the response and shown in the current UI.
- Provider keys are kept private and never returned to the browser.
- Public request rate limiting remains a deployment concern before unrestricted production use.

## Testing

```bash
npm run lint
npm run typecheck
node --test --experimental-strip-types lib/**/*.test.ts
npm run build
```

## Future milestones

1. Add durable request throttling for production traffic.
2. Add source-quality weighting and contradiction tracking.
3. Add verification stages that distinguish primary sources, independent tests, and marketing claims.
4. Replace provisional search output with a real recommendation ranking model and evidence schema.
