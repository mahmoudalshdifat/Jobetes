# Compliance — Jobetes

This folder is the audit trail. Every patient-data flow is tracked here.

## Index

- [`RECORDS_OF_PROCESSING.md`](RECORDS_OF_PROCESSING.md) — GDPR Art. 30 register
- [`DPIA_SKELETON.md`](DPIA_SKELETON.md) — Data Protection Impact Assessment skeleton (GDPR Art. 35)
- [`DPA_TEMPLATE.md`](DPA_TEMPLATE.md) — Data Processing Agreement template (Art. 28)
- [`JORDAN_PDPL_2023_CHECKLIST.md`](JORDAN_PDPL_2023_CHECKLIST.md) — Jordanian Personal Data Protection Law mapping
- [`ISO_27001_ANNEX_A_MAPPING.md`](ISO_27001_ANNEX_A_MAPPING.md) — Phase-0 Annex A controls
- [`AI_ACT_RISK_ASSESSMENT.md`](AI_ACT_RISK_ASSESSMENT.md) — EU AI Act classification
- [`PARAGRAPH_203_STGB_RISK_MATRIX.md`](PARAGRAPH_203_STGB_RISK_MATRIX.md) — German criminal confidentiality

## Phase 0 boundary

Phase 0 is **non-diagnostic** by design — `apps/api/src/routes/triage.ts` returns
*urgency category and topics to discuss*, never a diagnosis. This keeps the
feature **outside** MDR (Medical Device Regulation) territory.

If a future change would push us into a diagnostic claim, the
`AI_ACT_RISK_ASSESSMENT.md` and a notified-body conversation become
prerequisites, not afterthoughts.
