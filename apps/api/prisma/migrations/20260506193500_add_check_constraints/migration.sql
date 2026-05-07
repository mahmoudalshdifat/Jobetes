-- Add CHECK constraints for data integrity at the database level.
-- These complement the Zod schema validation in the API layer with
-- defence-in-depth: even a bug or manual SQL query cannot violate them.

-- Intake.severity must be between 0 and 10 (inclusive)
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_severity_check"
  CHECK ("severity" >= 0 AND "severity" <= 10);

-- Intake.symptomDurationDays must be non-negative when present
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_symptomDurationDays_check"
  CHECK ("symptomDurationDays" IS NULL OR "symptomDurationDays" >= 0);

-- Patient.dateOfBirth cannot be in the future
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_dateOfBirth_check"
  CHECK ("dateOfBirth" <= CURRENT_DATE);

-- Appointment.scheduledAt must be in the future when present
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_scheduledAt_check"
  CHECK ("scheduledAt" IS NULL OR "scheduledAt" > "requestedAt");

-- AuditLog.actorRole must be one of the known roles
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorRole_check"
  CHECK ("actorRole" IN ('patient', 'doctor', 'admin', 'system', 'operator'));

-- Staff.role must match the enum values
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_role_check"
  CHECK ("role" IN ('doctor', 'admin', 'nurse', 'operator'));
