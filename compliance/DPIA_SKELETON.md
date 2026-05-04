# DPIA Skeleton — Jobetes (GDPR Art. 35)

> Skeleton, not a final DPIA. Final version requires legal review (Med-IT specialist counsel).

## 1. Description of processing

- **Nature:** Cross-border telemedicine intake + AI-assisted (non-diagnostic) triage.
- **Scope:** Jordanian patients submit symptom data through a web form; an AI returns urgency category + discussion topics.
- **Context:** Voluntary, consent-based. Patient initiates the interaction.
- **Purposes:** Pre-consultation preparation, queue prioritization.

## 2. Necessity & proportionality

- Data minimization: only fields strictly needed for triage are collected (`packages/shared-schemas/src/intake.ts`).
- AI input is *de-identified* — no name/DOB sent to the model (`packages/ai-gemini/src/prompts.ts` builds prompts from `TriageInputSchema`).
- Lawful basis: explicit consent (Art. 9(2)(a)) for health data; consent flags are individually recorded with the locale they were presented in (`ConsentSchema`).

## 3. Risks to data subjects

| Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|
| Unauthorized disclosure (server breach) | Low (Phase 0 in-memory) → Med (Phase 1 Postgres) | High | Encryption-at-rest + RBAC + audit logs; Phase 0 doesn't persist |
| Re-identification via AI provider | Low | Med | De-identified prompts; provider DPA in place |
| Inadequate consent (language barrier) | Med | High | Consent presented in patient's preferred locale, recorded |
| Algorithmic harm (bad triage) | Low | High | Phase-0 disclaimers; emergency phone numbers always shown; routine + soon outputs only — no diagnosis |
| Cross-border transfer issues | Med | Med | Both sides covered by GDPR-equivalent (Jordan PDPL 2023); SCCs if any sub-processor outside EU |

## 4. Measures

- **Technical:** TLS 1.3, HSTS, CSP, Helmet middleware, rate-limiting, audit-log-with-PII-redaction, Vitest + axe gates in CI.
- **Organizational:** Hauptregel (max-parallel/zero-interference) reduces merge collisions; secrets never in repo; Renovate-monitored deps.
- **Patient-facing:** Banner-level emergency contact, plain-language consent at 6th-grade reading level (CDC literacy guidance), one-click withdrawal.

## 5. Sign-off

| Role | Name | Signed |
|---|---|---|
| Controller | Dr. Mahmoud Al-Shdaifat | ☐ |
| External counsel (Med-IT) | _to be appointed_ | ☐ |
| DPO (Phase 1) | _to be appointed_ | ☐ |
