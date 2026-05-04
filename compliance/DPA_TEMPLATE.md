# Data Processing Agreement — Template (GDPR Art. 28)

Between **Controller** (Dr. Mahmoud Al-Shdaifat, St. Anna Hospital Herne) and **Processor** (`<sub-processor name>`).

## 1. Subject matter
The Processor processes personal data on behalf of the Controller for the purpose of `<service description>` provided through Jobetes.

## 2. Duration
For the duration of the underlying service contract, plus any retention period required by law.

## 3. Categories
- **Data subjects:** patients (Jordan, Germany), the Controller and authorized clinic staff.
- **Personal data:** as listed in `RECORDS_OF_PROCESSING.md`.
- **Special categories:** health data (GDPR Art. 9). Explicit consent present.

## 4. Obligations of the Processor

- Process data only on documented instructions (Art. 28(3)(a)).
- Confidentiality obligations on personnel (Art. 28(3)(b)).
- Implement technical and organizational measures per Art. 32.
- Engage sub-processors only with prior written approval (Art. 28(2)).
- Assist with data-subject requests (Art. 28(3)(e)).
- Notify breaches without undue delay (Art. 33).
- On termination, delete or return data per controller instruction (Art. 28(3)(g)).

## 5. International transfers
Where the Processor is outside the EEA, transfer relies on adequacy decision OR Standard Contractual Clauses 2021/914/EU OR equivalent safeguards.

## 6. Sub-processors (Annex A)
- `<list>`

## 7. Technical and organizational measures (Annex B)
At minimum:
- Encryption-at-rest (AES-256)
- Encryption-in-transit (TLS 1.3, HSTS)
- RBAC with least privilege
- Audit logging with PII redaction
- Annual penetration test
- ISO 27001 mapping (see `ISO_27001_ANNEX_A_MAPPING.md`)

## 8. Audit
Controller may audit the Processor once per year with 30 days notice, or following a security incident.

## 9. Liability and indemnification
Per applicable law and the underlying service contract.

## 10. Governing law and venue
German law; venue Herne, Germany.
