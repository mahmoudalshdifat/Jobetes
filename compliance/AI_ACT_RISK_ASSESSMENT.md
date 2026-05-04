# EU AI Act — Risk Assessment for Jobetes Phase 0

## Classification

| Feature | EU AI Act Category | Reasoning |
|---|---|---|
| Triage assistant (non-diagnostic) | **Limited risk (Art. 50 transparency)** | Outputs urgency category + discussion topics, not diagnoses; clear disclaimers in every locale |
| Prompt-enhancer (operator bot) | Limited risk | Internal tool, not patient-facing |
| AI-generated educational videos (Phase 2 — Remotion) | Limited risk | Static content, doctor-reviewed before publish |

## Phase 0 transparency obligations (Art. 50)

- ✅ Users informed they interact with an AI system (`hero` banner + intake disclaimer).
- ✅ Outputs labeled as informational, not diagnostic (per-locale `DISCLAIMERS` in `triage.ts`).
- ✅ Emergency contact always visible.
- ✅ De-identified inputs to model (no name/DOB).

## High-risk trigger conditions (would flip classification)

If any of these are introduced, re-evaluate before launch:
- Diagnosis claim (e.g., "you have IBS")
- Treatment dosing recommendations
- Decisions affecting access to care without human review
- Use of biometric data
- Profiling for insurance / pricing

If triggered → high-risk obligations: conformity assessment, technical documentation, post-market monitoring, registration in EU database.
