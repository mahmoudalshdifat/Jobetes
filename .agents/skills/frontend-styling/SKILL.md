---
name: frontend-styling
description: Handle frontend visual and appearance changes for the Jobetes project. Use when the user asks to change how something looks, modify UI style or styling, update CSS or Tailwind classes, colors, fonts, spacing, layout, component appearance, responsive design, or any frontend visual aspect. Covers the web, admin, and doctor React apps. This skill is frontend-only; if backend data structures, API endpoints, or server logic changes are needed, delegate to the backend skill after completing frontend work.
---

# Frontend Styling

## Scope

This skill handles visual and UI appearance changes across the Jobetes frontend apps:
- `apps/web` — Patient-facing portal
- `apps/admin` — Admin dashboard
- `apps/doctor` — Doctor dashboard
- `packages/ui` — Shared UI components

**Boundary**: Frontend-only. Do NOT modify backend API routes, database schemas, Supabase functions, or server logic.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3 with custom design tokens
- Shared UI package: `@jobetes/ui`
- Class merging utility: `cn()` (clsx + tailwind-merge)

## Workflow

1. **Identify the target**: Determine which app and component/page needs changes. Ask clarifying questions only if the user's request is ambiguous about which screen or element.
2. **Check shared UI first**: If the change affects a reusable component (Button, Card, Field, etc.), modify `packages/ui/src/` so all apps benefit. Update `packages/ui/src/index.ts` exports if adding a new component.
3. **Use design tokens**: Always prefer Tailwind tokens from `tailwind.config.ts` and CSS variables. See [references/design-tokens.md](references/design-tokens.md).
4. **Follow component patterns**: Use variant/size maps with `cn()`. See [references/component-patterns.md](references/component-patterns.md).
5. **Maintain RTL & i18n**: The app supports Arabic (RTL). Ensure visual changes work in both LTR and RTL modes. Use logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of directional ones (`ml-`, `mr-`, `pl-`, `pr-`) where appropriate.
6. **Accessibility**: Do not reduce color contrast below WCAG AA. Respect `focus-visible`, `aria-*`, and `disabled` states. Run `pnpm a11y` in `apps/web` to validate with axe-core.
7. **Test**: Run `pnpm typecheck`, `pnpm lint`, and `pnpm test` for the affected app/package. All three frontend apps (`web`, `admin`, `doctor`) and `packages/ui` support these commands.
8. **Backend needed?** If the change requires new data or API modifications, invoke the `backend-api` skill after frontend changes are complete. See **Cross-skill delegation** below.

## Cross-skill delegation

This skill is **frontend-only**. If you encounter any of the following during a task, you must delegate to the `backend-api` skill:
- New API endpoints or route changes are needed
- Database schema modifications are required
- Auth logic or JWT handling needs updates
- Server-side business logic must change
- Supabase edge functions need modification
- Zod validation schemas in `packages/shared-schemas` need changes

**How to delegate**: After completing all possible frontend work, explicitly state: *"This change also requires backend work. I am now loading the `backend-api` skill to handle the API/database changes."* Then proceed using the backend-api skill's workflow and references.

## Quick Reference

### File locations
- Web app: `apps/web/src/`
- Admin app: `apps/admin/src/`
- Doctor app: `apps/doctor/src/`
- Shared UI: `packages/ui/src/`
- Web tailwind config: `apps/web/tailwind.config.ts`
- CSS variables: `packages/ui/src/styles.css`
- API client (web): `apps/web/src/lib/api-client.ts`
- Vite config (web): `apps/web/vite.config.ts`

### Class merging
Always use `cn()` from `@jobetes/ui`:
```tsx
import { cn } from '@jobetes/ui';
className={cn('base-classes', conditional && 'conditional-class', className)}
```

### Path alias
The `apps/web` Vite config defines `@/` as `src/`. Prefer `import { ... } from '@/lib/...'` over relative paths when importing from `src/`.

### API client
The frontend talks to the backend via `JobetesApiClient` in `apps/web/src/lib/api-client.ts`. It supports two transports:
- `edge` (default) — Supabase Edge Functions, flat paths like `/intake`
- `fastify` — local Fastify API, prefixed paths like `/api/health`

If the backend adds a new endpoint that the frontend must call, add the corresponding method to `JobetesApiClient` with both `edge` and `fastify` path mappings.

### Shared components to reuse
- `Button` — variants: `primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`
- `Card`, `Field`, `Stepper`, `LangToggle`, `EmergencyBanner`, `TrustBar`, `DoctorBadge`, `Testimonials`, `Faq`, `JordanCallout`, `WhatsAppButton`, `WhyGerman`
