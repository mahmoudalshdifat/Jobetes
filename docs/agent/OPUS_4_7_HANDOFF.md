# Hands-Off for Opus 4.7 — Jobetes Operating Manual

> Last updated: 2026-05-04 (initial). Update this file whenever a new "what worked / never do / shocking" finding emerges.

---

## 1. Project Snapshot

- **What:** Cross-border telemedicine portal — Dr. Mahmoud Al-Shdaifat (St. Anna Hospital Herne, gastroenterology) serving Arabic-speaking patients in Jordan.
- **Repo (local):** `Jobetes/`. **Remote:** `github.com/mahmoudalshdifat/Jobetes` (also referenced as `DiggAiHH/Jordan-Health-App`).
- **Stack:** pnpm + Turborepo · Vite + React 18 + TS + Tailwind · react-i18next (AR-RTL/DE/EN) · Fastify · Gemini · Vitest + Playwright + axe · Netlify + Fly.io.
- **Workspaces:** `apps/{web, api, operator-bot}`, `packages/{ui, ai-gemini, i18n, shared-schemas, eslint-config}`.
- **Compliance baseline:** GDPR · §203 StGB · Jordan PDPL 2023 · WCAG 2.2 AA · EU AI Act limited-risk · ISO/IEC 27001 (mapped, not certified).

---

## 2. The Hauptregel (project-wide rule)

> **Maximum subagents · Maximum parallelism · Zero interference.**

Operationalized:

1. Decompose every multi-step task into packages with **disjoint write authorities**. State the disjointness proof when launching.
2. Bundle independent tool calls and Agent invocations into **one message**.
3. Use `isolation: "worktree"` for parallel agents that might collide.
4. Read-only by default; grant write only when needed.
5. Each prompt produces a 5-line run-log in `memory/runs/YYYY-MM-DD_<model>-NN.md`.

---

## 3. Routing Heuristic — model & tool

**Model:**

| Task type | Model | Why |
|---|---|---|
| Single-line classification, locale detect, translation strings | Haiku 4.5 | 5× cheaper, fast |
| Code generation, refactors, route handlers | Sonnet 4.6 | Quality/cost balance |
| Architecture decisions, compliance reviews, multi-file reasoning | Opus 4.7 | Depth required |

**Tool:**

| Situation | Tool |
|---|---|
| Known file path | `Read` directly (don't search) |
| Known symbol | `grep` via `Bash` |
| ≤ 3 lookups | direct |
| > 3 lookups, multi-area | `Agent(Explore)` |
| Multi-step write across packages | `Agent(general-purpose)` per package |
| Web research | `WebFetch` for known URL, `WebSearch` for unknown |

---

## 4. Cache Discipline (Anthropic prompt caching)

- **Cache:** the system prompt, tool definitions, stable docs.
- **Don't cache:** transient conversation context, per-request user input.
- TTL: 5-min default, 1-hour for very stable content (write cost 2.0×, read 0.10×).
- Hard limit: 4 cacheable blocks per request — spend them on the largest static surfaces.

---

## 5. What Worked

- **Disjoint write paths per parallel team** (frontend, backend, ai, ui, compliance, devops, tests, agent-docs) — zero file conflicts in Phase-0 build.
- **Mock-fallback in `@jobetes/ai-gemini`** — entire app testable end-to-end without API keys; `provider.ts:createGeminiProvider` returns mock when key empty.
- **RTL via logical Tailwind utilities (`ms-`/`me-`)** — never hardcoded `margin-left`/`margin-right`. Direction flips automatically when `dir="rtl"`.
- **Zod schemas shared FE/BE** in `@jobetes/shared-schemas` — single source of truth, type-safe across boundaries.
- **PII redaction at logger ingest** (Pino redact paths) — logs are safe to ship to ops.
- **Allowlist-only Telegram bot** — non-allowlisted user IDs receive *no reply at all*, not a "permission denied" message.

## 6. What to Never Do Again

- **Adopt AGPL-3.0 dependencies** in this repo. Killed Claude-Mem in research — copyleft is incompatible with closed-source healthcare deployment.
- **Hardcode `margin-left` / `padding-right`** etc. in components — RTL-breaker.
- **Send Sampling parameters** (`top_p`/`top_k`/`temperature`) to Opus 4.7 — model rejects them.
- **Add long `sleep` loops** in shell or Bash to "wait" for things — prefer `run_in_background` + notification.
- **Exit Plan Mode without `ExitPlanMode`** — the harness needs the explicit signal.
- **Stuff PII into prompts.** AI provider sees only de-identified clinical context (`TriageInputSchema` strips name/DOB/phone).
- **Treat Phase 0 as a medical device.** Adding a *diagnostic* claim flips MDR + AI-Act high-risk obligations. If a future change introduces one, escalate.
- **Pass a pre-built pino instance to Fastify v5 via `loggerInstance:`**. Narrows `FastifyInstance<…, Logger<…>>` and breaks downstream `app.register(...)` under `module: NodeNext`. Pass logger as **options object** (`logger: { level, redact, transport }`) and let Fastify build pino. Bug we hit on 2026-05-04.
- **Trust that `tsc --noEmit` mirrors `tsc -p tsconfig.build.json`.** They use different `moduleResolution` and produced different errors here. Always run `pnpm build` (not just typecheck) before declaring victory.
- **Forget that pnpm workspaces don't hoist binaries to subpackage `node_modules/.bin`.** Add the binary's package as a devDep at the root and use `pnpm exec <bin>` from subpackages, OR add it as a devDep in every consumer. Don't expect a tool listed only in `@jobetes/eslint-config`'s `dependencies` to be invokable from `apps/web`.
- **Use `import('react').ReactElement` inside ambient declarations.** ESLint's `@typescript-eslint/consistent-type-imports` rule rejects it. Use a top-level `import type { ReactElement } from 'react'` instead.
- **Set Vite `build.target` lower than `es2022`** if any module uses top-level `await` (e.g. `await i18next.init(...)`). Default Vite target is broader and bricks the build.
- **Reference `typeof <const>` inside a callback parameter of that const's own initializer.** TypeScript flags TS2502 ("referenced directly or indirectly in its own type annotation"). Hoist the type into a named interface first, then use it in both the const and the callback.
- **Type a logger parameter as `Logger` from `pino`** when the call site might pass `app.log` (`FastifyBaseLogger`). They are not interchangeable. Use a structural `LogLike = { info: (obj: object, msg?: string) => void }` so the function accepts both.
- **Forget `prisma generate` in postinstall.** The generated client is what TypeScript imports — without it, every consumer of `@prisma/client` breaks at build. Append `|| true` so the install does not fail in contexts where the schema is absent.

## 7. Shocking / Surprising

- **46 % of trust judgment in healthcare apps comes from visual design alone** (Stanford Web Credibility Project). Design is a KPI, not cosmetics.
- **65.6 % of Muslim GI patients have a gender preference for endoscopists** (PubMed 2021). Default UI must offer the option without making it awkward.
- **Opus 4.7 has a ~35 % tokenizer expansion** at unchanged price-per-token. Track actual output tokens, not estimates.
- **Stanford-level trust signals** in this domain include: clinic photo, named credentials in the patient's language, hospital link to a publicly verifiable profile. We use all three.
- **Jordan: 92.5 % internet penetration, 99.7 % 4G** — mobile-first is non-negotiable. Bandwidth is generous but not unlimited; image budgets matter.

## 8. Token-Frugality Tactics

1. **Cache the system prompt + tool list.** Read cost drops to ~10 % of write cost.
2. **Run sub-agents for verbose output** (test runs, log parsing). Their output stays in their context; only summary returns.
3. **Tool results return references**, not full payloads. Big artifacts go to disk; the tool returns the path.
4. **Route by input size:** Haiku < 500 tokens, Sonnet 500–5000, Opus > 5000 + reasoning.
5. **Batch API for non-urgent jobs.** 50 % discount.
6. **Disable thinking** for non-critical tasks. Re-enable only when accuracy is the bottleneck.

---

## 9. Run-Log Pflicht

Every prompt produces a 5-line file in `memory/runs/`:

```markdown
- **Goal:** …
- **Did:** …
- **Result:** … (with measurable variable, e.g. "lint:0, tests:142/142, axe:0 critical")
- **Surprise:** … or "—"
- **Next:** …
```

Numbering: `YYYY-MM-DD_<model>-NN.md` — increment NN per prompt within a day.

---

## 10. Pre-Merge Compliance Checklist

Before merging any PR:

- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm lint` — 0 errors
- [ ] `pnpm test` — 100 % pass, coverage ≥ 85 % in `packages/*` and route handlers
- [ ] `pnpm build` — succeeds, web bundle initial < 250 KB gzip
- [ ] `pnpm a11y` — 0 critical/serious axe violations
- [ ] gitleaks — clean
- [ ] If patient-data flow changed → `compliance/RECORDS_OF_PROCESSING.md` updated
- [ ] If user-facing string changed → AR/DE/EN parity in `packages/i18n/locales/`
- [ ] If AI prompt changed → `prompts.ts` `TRIAGE_PROMPT_VERSION` bumped

---

## 11. Self-Direction Loop (post-prompt)

After every substantive prompt, **YOU MUST**:

1. Append a fresh entry to `memory/runs/<today>_<model>-<NN>.md` (5-line format).
2. If a new "What worked / Never do / Shocking" item emerged → update §5/§6/§7 above.
3. Update the home memory at `~/.claude/projects/-workspaces-Jobetes/memory/` for any new user/project/feedback context.
4. Propose the **next prompt** (or **next structure**) self-directively, with concrete acceptance criteria. Phrase it so it can be executed without further clarification.

This closes the loop. Do not skip step 4.
