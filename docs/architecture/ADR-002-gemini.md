# ADR-002 — Gemini as primary AI provider

Status: Accepted, 2026-05-04

## Context

User specified Gemini API for AI features. Alternatives considered: OpenAI, Anthropic, on-prem open-weights.

## Decision

Use **Google Gemini API** as the primary provider, behind a thin abstraction `@jobetes/ai-gemini`.

## Consequences

- Provider-agnostic interface (`AiProvider`) lets us swap providers later without changing call sites.
- Mock-fallback when `GEMINI_API_KEY` is empty — apps remain functional in offline / CI / local-dev.
- DPA with Google applies. Region routing per Google's data-processing addendum.
- Trade-off: vendor lock-in is mitigated by the abstraction; in practice, switching providers requires re-tuning prompts.
