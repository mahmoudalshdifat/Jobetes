# ISO/IEC 27001:2022 — Annex A controls covered in Phase 0

Phase 0 is not a full ISMS; we map the Annex-A controls relevant to a small clinic-scale operation.

| Control | Phase 0 implementation |
|---|---|
| **A.5.1** Policies for information security | `SECURITY.md` + `compliance/` index |
| **A.5.10** Acceptable use of information | `CONTRIBUTING.md` quality bar |
| **A.5.15** Access control | RBAC stub in API (Phase 1 expands), allowlist on operator bot |
| **A.5.23** Information security for use of cloud services | Netlify + Fly + Google DPAs |
| **A.5.34** Privacy and protection of PII | `RECORDS_OF_PROCESSING.md` |
| **A.6.6** Confidentiality / non-disclosure | License + DPA template |
| **A.8.2** Privileged access rights | Single human admin (Dr. Al-Shdaifat) until Phase 1 |
| **A.8.5** Secure authentication | Phase 1 — Supabase Auth or Clerk |
| **A.8.9** Configuration management | All env via `.env.example`, no secrets in repo |
| **A.8.12** Data leakage prevention | Pino PII redaction, gitleaks CI scan |
| **A.8.15** Logging | Pino + structured JSON + redaction |
| **A.8.16** Monitoring | Sentry (Phase 1) |
| **A.8.20** Networks security | TLS 1.3, HSTS, CSP, COOP |
| **A.8.23** Web filtering | n/a |
| **A.8.25** Secure development life cycle | TS strict + lint + test + axe gates in CI |
| **A.8.28** Secure coding | `eslint-plugin-security` (Phase 1), Zod validation at every boundary |

Out of scope for Phase 0: full ISO 27001 certification (requires formal ISMS, internal audits, management review). Phase 2 target.
