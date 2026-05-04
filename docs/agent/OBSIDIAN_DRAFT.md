# Obsidian Vault Draft — Jobetes

Importable as an Obsidian vault. Filenames + structure ready; populate as the project grows.

## Vault structure

```
Jobetes-Vault/
├── 00 Index.md                                 # MOC (Map of Content) — the vault home
├── 01 Doctor/
│   ├── Mahmoud Al-Shdaifat.md                 # → see "01 Doctor / Mahmoud …" below
│   └── Anna Hospital Herne.md
├── 02 Patient Personas/
│   ├── Persona — Layla 54 IBS Amman.md
│   ├── Persona — Omar 67 GERD+Diabetes Irbid.md
│   └── Persona — Yasmeen 32 Pregnancy+GI Aqaba.md
├── 03 Research/
│   ├── Trust in Healthcare — Studies.md
│   ├── Simplicity & Cognitive Load.md
│   └── Jordan Cultural & Regulatory.md
├── 04 Architecture/
│   ├── ADR-001 Monorepo Choice.md
│   ├── ADR-002 Gemini over GPT.md
│   ├── ADR-003 Netlify + Fly Split.md
│   ├── ADR-004 Reject Claude-Mem (AGPL).md
│   └── ADR-005 Phase-0 = Not a Medical Device.md
├── 05 Compliance/
│   ├── DSGVO Records of Processing.md
│   ├── Jordan PDPL 2023.md
│   └── ISO 27001 Mapping.md
├── 06 Agent Playbook/
│   ├── Hauptregel — Max Parallel Null Interferenz.md
│   ├── Run-Log Template.md
│   ├── Opus 4.7 Hands-Off.md
│   └── Tool Routing Heuristik.md
└── 07 Tasks/
    └── Phase 0 Backlog.md
```

---

## 00 Index.md

```markdown
# Jobetes

Cross-border telemedicine for Dr. Mahmoud Al-Shdaifat → Jordanian patients.

## Maps of Content
- [[01 Doctor/Mahmoud Al-Shdaifat]]
- [[02 Patient Personas/Persona — Layla 54 IBS Amman]]
- [[03 Research/Trust in Healthcare — Studies]]
- [[04 Architecture/ADR-001 Monorepo Choice]]
- [[05 Compliance/DSGVO Records of Processing]]
- [[06 Agent Playbook/Hauptregel — Max Parallel Null Interferenz]]
- [[07 Tasks/Phase 0 Backlog]]

## Quick links
- Repo: `github.com/mahmoudalshdifat/Jobetes`
- Hospital profile: https://www.annahospital.de/klinik-fuer-gastroenterologie/team.html
```

---

## 01 Doctor/Mahmoud Al-Shdaifat.md

```markdown
# Mahmoud Al-Shdaifat, MD

**Title:** Oberarzt — Klinik für Gastroenterologie
**Hospital:** [[Anna Hospital Herne]]
**Languages:** Deutsch · English · Arabic (heritage — confirm before AR-only publishing)

## Credentials
- Facharzt für Innere Medizin und Gastroenterologie
- Diabetologe DDG / ÄKWL
- Notfallmedizin
- Wundtherapie ICW

## Sub-specialties
- Diagnostic + therapeutic endoscopy
- IBD (chronic inflammatory bowel disease)
- Diabetes mellitus management with comorbidities
- Hepatology
- Emergency medicine

## App-branding decisions
- Hero: full title + hospital + city
- Photo: from Anna Hospital team page (with explicit consent)
- Trust markers: link to hospital profile, named credentials in patient's locale
```

---

## 03 Research/Trust in Healthcare — Studies.md

```markdown
# Trust in Healthcare — Studies

| Finding | Source | Application |
|---|---|---|
| 46.1 % of credibility judgment from visual design | Stanford Web Credibility Project | Editorial-grade design is a KPI |
| Doctor identity + transparent data handling = top trust drivers | Corritore et al. 2007; npj Digital Medicine 2025 | DoctorBadge + RECORDS_OF_PROCESSING |
| Trust correlates 0.51 with patient satisfaction (telemedicine) | JMIR Human Factors 2021 | Trust UX is product, not polish |
| 45 % of Jordanian tele-patients have privacy concerns | PMC 2022 (Jordan) | Privacy-first onboarding, AR consent |
| Telemedicine usage tripled 2020→2024 | OECD 2025 | Category exists; expectations exist |
```

---

## 04 Architecture/ADR-004 Reject Claude-Mem (AGPL).md

```markdown
# ADR-004 — Reject Claude-Mem (AGPL-3.0)

**Status:** Accepted, 2026-05-04

## Context
Researched `claude-mem` for cross-session memory. License is AGPL-3.0.

## Decision
Reject. Build memory on:
1. `~/.claude/projects/.../memory/` (per-user agent memory — already present)
2. `memory/runs/` in repo (5-line discipline)
3. Postgres `pgvector` (Phase 1) for patient-session memory under our DPA

## Consequence
- No additional legal review of copyleft compatibility
- More code to write — but ownership of the memory layer
- Free choice of provider for vector store
```

---

## 06 Agent Playbook/Hauptregel — Max Parallel Null Interferenz.md

```markdown
# Hauptregel — Maximale Subagenten · Maximale Parallelität · Null Interferenz

Operative für jede Multi-Step-Aufgabe:

1. **Disjunkte Schreib-Hoheiten beweisen** — bevor irgendein Subagent startet.
2. **Eine Message, viele Tool-Calls** — niemals seriell, wenn parallel möglich.
3. **Worktree-Isolation** für riskante parallele Schreibvorgänge.
4. **Read-only by default** — Schreibrechte nur wo nötig.
5. **Run-Log-Pflicht** — 5 Zeilen pro Prompt.

Ohne diese Regel verliert der Engineering-Harness seinen Vorteil.
```

---

## 07 Tasks/Phase 0 Backlog.md

```markdown
# Phase 0 Backlog

## Done
- [x] Repo bootstrap, monorepo, Turborepo
- [x] Foundation packages (eslint, schemas, i18n, ai-gemini, ui)
- [x] apps/api with health, doctor, intake, triage routes + tests
- [x] apps/web with i18n RTL, hero, doctor, intake wizard, legal
- [x] apps/operator-bot with Telegram + STT + prompt-enhance + CLI-Anything + codespace wake
- [x] Compliance: Records of Processing, DPIA skeleton, DPA template, Jordan PDPL, ISO 27001, AI Act, §203
- [x] Legal pages AR/DE/EN
- [x] DevOps: Netlify, GitHub Actions, Fly, Dockerfile
- [x] Hands-Off, Run-Log template, Obsidian draft

## User-action stops (need Dr. Mahmoud)
- [ ] U1 — `GEMINI_API_KEY` from Google AI Studio
- [ ] U2 — Domain (jobetes.health? dr-shdaifat.de?)
- [ ] U3 — Netlify + Fly accounts
- [ ] U4 — Auth provider (Supabase recommended)
- [ ] U5 — Anna Hospital photo + bio confirmation
- [ ] U6 — Remotion license check
- [ ] U7 — Med-IT lawyer review (DSFA, DPA)
- [ ] U8 — Jordanian counsel review (PDPL 2023)
- [ ] U9 — Native Arabic lectorate
- [ ] U10 — GitHub PAT with `codespace` scope
- [ ] U11 — Telegram bot from @BotFather + Dr. Mahmoud's user ID
```
