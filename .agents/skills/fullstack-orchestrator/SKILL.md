---
name: fullstack-orchestrator
description: Orchestrate fullstack changes across the Jobetes project that require both frontend and backend work. Use when the user asks to build a new feature, implement an end-to-end flow, add a screen with data persistence, or any request that clearly spans UI changes AND server-side/API/database changes. This skill delegates frontend work to the frontend-styling skill and backend work to the backend-api skill, coordinating the sequence so backend contracts are defined before frontend consumption.
---

# Fullstack Orchestrator

## Scope

Coordinate cross-cutting changes that touch both frontend and backend:
- New features with UI + API + data model
- End-to-end flows (form submission → API → database → display)
- Auth flows that need both UI and server changes
- Dashboards or admin screens that query new data

## Delegation Strategy

Always follow this order:

1. **Backend first**: Invoke the `backend-api` skill to:
   - Define or update Zod schemas in `packages/shared-schemas`
   - Add/modify API routes or edge functions
   - Update database schema and migrations
   - Define the data contract

2. **Frontend second**: After backend contracts are stable, invoke the `frontend-styling` skill to:
   - Build or modify React components
   - Add form validation using the same Zod schemas
   - Wire up API calls to the new endpoints
   - Style the new UI

## Decision Tree

| User Request | Action |
|-------------|--------|
| "Change the button color" | Invoke `frontend-styling` only |
| "Add a new API endpoint" | Invoke `backend-api` only |
| "Build a patient notes feature" | **This skill** → backend first, then frontend |
| "Add a settings page where patients can update their profile" | **This skill** → backend first, then frontend |
| "The intake form should also ask for allergies" | **This skill** → schema + API first, then form UI |

## Workflow

1. **Decompose**: Break the request into backend tasks and frontend tasks.
2. **Shared schema**: If data shapes change, start with `packages/shared-schemas`.
3. **Backend contract**: Define the API (route, request/response, auth requirements).
4. **Persistence**: If data is stored, update Prisma schema and create migration.
5. **Frontend UI**: Build components, forms, and pages using the defined contract.
6. **Integration**: Ensure frontend API calls match the backend routes exactly.
7. **Test end-to-end**: Run `pnpm quant` (typecheck + lint + test + build) at root.

## Cross-Skill Communication

When delegating, pass this context:
- **To backend-api**: "Frontend needs endpoint X to return shape Y for new screen Z"
- **To frontend-styling**: "Backend endpoint X at `POST /api/x` returns shape Y. Build UI component Z that consumes it."

## Quick Reference

### Monorepo commands
- `pnpm dev` — Start all apps in parallel
- `pnpm quant` — Full quality gate (typecheck, lint, test, build)
- `pnpm e2e` — Playwright end-to-end tests

### Key integration points
- Shared schemas: `packages/shared-schemas/src/`
- Web app API calls: `apps/web/src/lib/` (check existing patterns)
- Auth: Supabase JWT shared across frontend and backend
