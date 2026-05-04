# Security Policy

Jobetes processes patient data. Treat every security report as urgent.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security reports.

Email: `wanderwellcare@gmail.com` with subject `[SECURITY] Jobetes`.

Include:
- Affected component (`apps/web`, `apps/api`, `apps/operator-bot`, …)
- Reproduction steps
- Impact assessment
- Whether the issue is already disclosed

We aim to:
- Acknowledge within **48 hours**
- Provide an initial assessment within **5 business days**
- Coordinate disclosure timing with the reporter

## Scope

In scope: any code in this repository.

Out of scope: third-party dependencies (report upstream), social-engineering attacks, physical security of clinic devices, denial-of-service attacks against managed providers.

## Encryption

- **In transit:** TLS 1.3 enforced (HSTS, `upgrade-insecure-requests`).
- **At rest:** AES-256 (Postgres TDE, Supabase storage default).
- **Secrets:** never committed; managed via Netlify/Fly env vars.

## Disclosure of patient data

If a security incident exposes patient data:
- §203 StGB notification obligations apply (Germany).
- GDPR Art. 33: notify supervisory authority within 72 hours.
- Jordan PDPL 2023: notify the Personal Data Protection Council per the Law's incident-response provisions.
- All affected patients receive direct, plain-language notification in their language (AR/EN/DE).
