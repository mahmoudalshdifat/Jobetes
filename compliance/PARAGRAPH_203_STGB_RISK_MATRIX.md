# §203 StGB — Risk Matrix

§203 of the German Criminal Code criminalizes unauthorized disclosure of professional secrets, including medical confidentiality. Violations are personal — they apply to the doctor and to any "Gehilfe" (assistant, sub-processor) who processes patient data.

## Roles

| Role | §203 status | Mitigation |
|---|---|---|
| Dr. Al-Shdaifat (controller) | Primary subject — bears criminal liability | Direct compliance with all obligations below |
| Hospital staff with API access | "mitwirkende Personen" §203 (3) | Confidentiality undertaking required before access |
| Cloud sub-processors (Netlify, Fly, Google) | "mitwirkende Personen" §203 (3) | DPA + confidentiality clauses; staff bound to confidentiality |
| Operator-bot maintainer | "mitwirkende Personen" §203 (3) | Same as above |

## Required organizational steps (before Phase 1 launch)

- [ ] Each sub-processor signs a confidentiality undertaking referencing §203(4) StGB.
- [ ] Hospital staff with patient-data access sign equivalent local NDA.
- [ ] Operator-bot allowlist hard-restricted to Dr. Al-Shdaifat.
- [ ] PII redaction in all logs (already implemented).
- [ ] Incident-response plan includes §203-specific notification path.

## What §203 does NOT excuse

- A breach by a sub-processor (Netlify outage exposing data) still triggers §203 *for Dr. Al-Shdaifat* unless he can prove he chose the sub-processor with appropriate care and put confidentiality in place. The DPA + due-diligence file in `compliance/` is that proof.
