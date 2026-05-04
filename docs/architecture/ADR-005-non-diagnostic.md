# ADR-005 — Phase 0 is intentionally not a medical device

Status: Accepted, 2026-05-04

## Context

The triage assistant could be perceived as a medical device under EU MDR if it makes diagnostic claims or recommends specific treatments. That would trigger a notified-body conformity assessment, technical file, post-market surveillance, etc. — all valuable but disproportionate for Phase 0.

## Decision

Phase 0 is **explicitly non-diagnostic**:

- The triage tool returns an *urgency category* and *topics for consultation*, not a diagnosis.
- Every output carries a locale-specific disclaimer with emergency phone numbers.
- Inputs to the model are **de-identified** (no name/DOB/phone/email).
- Per `compliance/AI_ACT_RISK_ASSESSMENT.md`, this is a *limited-risk* AI Act feature.

## Consequences

- We can ship Phase 0 quickly under existing GDPR/PDPL framework.
- A future feature change that adds a diagnostic claim **flips classification** — this ADR is the trip-wire. Any such change must reference and update this ADR before merge.
