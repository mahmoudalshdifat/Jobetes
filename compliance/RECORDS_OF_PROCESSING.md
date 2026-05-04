# Records of Processing (GDPR Art. 30)

Last updated: 2026-05-04

| # | Activity | Categories of data subjects | Categories of data | Lawful basis | Recipients | Retention | Security measures |
|---|---|---|---|---|---|---|---|
| 1 | Patient intake form | Patients in Jordan and Germany | Identity (name, DOB, contact), Health (Art. 9 — symptoms, medications, allergies, conditions), Cultural context (gender preference, fasting) | Art. 6(1)(a) consent + Art. 9(2)(a) explicit consent for health data | Dr. Al-Shdaifat as controller; Postgres in EU (Phase 1); no third-party marketing | 24 months from last contact (Phase 1) — Phase 0 is in-memory only | TLS 1.3 in transit; AES-256 at rest (Phase 1); RBAC; audit log |
| 2 | AI triage (non-diagnostic) | Same as #1 | De-identified clinical context (no name/DOB sent to model) | Same as #1, separate consent flag (`processingHealthData`) | Google Gemini API (sub-processor, EU/global routing) | Not stored at provider beyond request lifetime (per Google API ToS) | DPA with Google; provider can be swapped via `@jobetes/ai-gemini` abstraction |
| 3 | Audit log | Patients (intake-IDs only) | Request metadata (no PII — `apps/api/src/logger.ts` redacts name/DOB/phone/email) | Art. 6(1)(c) legal obligation + (1)(f) legitimate interest | Internal only | 12 months | Pino redaction at ingest; logs encrypted at rest |
| 4 | Operator bot transcripts | Dr. Al-Shdaifat (operator only) | Voice/text instructions to the agent — may incidentally contain PHI | Art. 6(1)(b) contract performance (operator-self-controller) | Telegram (transit), Gemini/Whisper (STT processing) | Telegram retains messages per its own ToS; we don't persist | Allowlist hard-restricts to Dr. Al-Shdaifat; audio not persisted |
| 5 | Doctor profile | Dr. Al-Shdaifat | Public bio + credentials | Art. 6(1)(b) contract / publicity | Public website visitors | Indefinite while clinic active | Source of truth: hospital page; static rendering |

## Sub-processors (current)

| Provider | Purpose | Region | DPA status (Phase 0 → Phase 1) |
|---|---|---|---|
| Netlify | Web hosting | Global CDN, EU-config available | Standard DPA — review before launch |
| Fly.io | API hosting | `fra` (Frankfurt) | Standard DPA — review before launch |
| Google (Gemini API) | AI provider | Global | Google AI/ML Data Processing Addendum applies |
| Telegram | Messaging surface (operator only) | — | Operator workflow only; no patient data flows here |

## Data Subject Rights

For Phase 0 (non-persistent), most rights are trivially satisfied
(no data is stored beyond request lifetime). For Phase 1, expose:

- Art. 15 access — `GET /me/data`
- Art. 16 rectification — patient portal edit
- Art. 17 erasure — `DELETE /me/data`
- Art. 20 portability — JSON export
- Art. 21 objection / opt-out

Owner: Dr. Al-Shdaifat acts as controller for Phase 0. A formal DPO appointment is required before Phase 1 launch.
