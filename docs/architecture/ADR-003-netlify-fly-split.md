# ADR-003 — Netlify (web) + Fly.io (api) split

Status: Accepted, 2026-05-04

## Context

User specified Netlify for deployment. The web app is a static SPA (great Netlify fit). The API is stateful Fastify and benefits from a long-running server.

## Decision

- **Web** → Netlify (CDN, edge, free tier covers Phase 0).
- **API** → Fly.io, region `fra` (Frankfurt) — keeps EU-resident processing for GDPR.

## Consequences

- Two deploy targets but each is best-in-class for its use case.
- API region `fra` keeps health data in Germany — easier §203 / GDPR story.
- Trade-off: cross-origin requires careful CORS + CSP. Both are configured strictly.
