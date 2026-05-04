# Jordan Personal Data Protection Law (PDPL) 2023 — Checklist

Jordanian patients are protected under PDPL 2023. Cross-border transfer to Germany triggers the Law's transfer provisions.

| PDPL article (subject) | Jobetes status |
|---|---|
| **Lawful basis & consent** | ✅ Explicit consent flags in `ConsentSchema`; presented in patient's preferred locale (Arabic by default). |
| **Data minimization** | ✅ Schemas accept only what triage needs. No national-ID number requested. |
| **Special categories (health)** | ✅ Separate consent flag `processingHealthData`. |
| **Cross-border transfer** | ✅ `crossBorderTransfer` consent flag. ⚠️ Local-counsel review required for adequacy mechanism. |
| **Data subject rights** | Phase 0: trivially satisfied (no persistence). Phase 1: dedicated routes per right. |
| **Data Controller registration** | ⚠️ Required if Jordan locally is deemed the controller-jurisdiction; counsel review pending. |
| **Notification of incidents** | ✅ See `SECURITY.md` — Personal Data Protection Council notification mapped to GDPR-72h workflow. |
| **Children & vulnerable subjects** | ✅ Phase 0 will not solicit minors without explicit guardian consent flow (deferred to Phase 1). |

**Action item U8** (in plan): commission Jordanian counsel for PDPL 2023 local review prior to public launch.
