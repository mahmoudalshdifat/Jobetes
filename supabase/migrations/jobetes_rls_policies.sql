-- Jobetes RLS policies. Pending explicit authorization (harness blocked
-- automatic application). Apply via Supabase dashboard SQL editor or via
-- `supabase db push` once the user authorizes.
--
-- Status: 2026-05-04. Tables created without RLS — anon key currently exposes
-- schema metadata. No data rows present. Apply this ASAP.

ALTER TABLE "Patient"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Consent"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Intake"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Triage"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"    ENABLE ROW LEVEL SECURITY;

-- ─── Patient: a Supabase user sees and updates only their own row ──────────
CREATE POLICY "patient_self_select" ON "Patient" FOR SELECT TO authenticated
  USING ("supabaseUserId" = auth.uid());
CREATE POLICY "patient_self_update" ON "Patient" FOR UPDATE TO authenticated
  USING ("supabaseUserId" = auth.uid())
  WITH CHECK ("supabaseUserId" = auth.uid());

-- ─── Intake: patient sees their own; insert via service-role only ──────────
CREATE POLICY "intake_self_select" ON "Intake" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Patient" p
    WHERE p."id" = "Intake"."patientId" AND p."supabaseUserId" = auth.uid()
  ));

-- ─── Triage: scoped via Intake → Patient chain ─────────────────────────────
CREATE POLICY "triage_self_select" ON "Triage" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Intake" i JOIN "Patient" p ON p."id" = i."patientId"
    WHERE i."id" = "Triage"."intakeId" AND p."supabaseUserId" = auth.uid()
  ));

-- ─── Appointment: patient sees their own ───────────────────────────────────
CREATE POLICY "appointment_self_select" ON "Appointment" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Patient" p
    WHERE p."id" = "Appointment"."patientId" AND p."supabaseUserId" = auth.uid()
  ));

-- ─── Message: patient sees their thread ────────────────────────────────────
CREATE POLICY "message_self_select" ON "Message" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Patient" p
    WHERE p."id" = "Message"."patientId" AND p."supabaseUserId" = auth.uid()
  ));

-- ─── Consent: linked patient can read their own consent record ─────────────
CREATE POLICY "consent_self_select" ON "Consent" FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Intake" i JOIN "Patient" p ON p."id" = i."patientId"
    WHERE i."consentId" = "Consent"."id" AND p."supabaseUserId" = auth.uid()
  ));

-- ─── AuditLog: no policies for anon/authenticated → service-role only ──────
COMMENT ON TABLE "AuditLog" IS
  'No RLS policies for anon/authenticated. Only the service-role key (used by the API) can read or write here.';
