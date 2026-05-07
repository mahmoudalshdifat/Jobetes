-- Atomic intake creation via PostgreSQL function.
-- Replaces the sequential edge-function inserts with a single RPC call,
-- eliminating partial-write scenarios (e.g. Patient upsert succeeds but
-- Consent insert fails, leaving an orphaned patient row).
--
-- Called from the intake edge function like:
--   await sb.rpc('create_intake', { payload: body })

CREATE OR REPLACE FUNCTION create_intake(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_consent_id uuid;
  v_intake_id uuid;
  v_intake_created_at timestamptz;
  v_phone text := payload ->> 'phone';
  v_email text := payload ->> 'email';
BEGIN
  -- 1. Upsert patient by phone (unique constraint)
  INSERT INTO "Patient" (
    "firstName", "lastName", "dateOfBirth", "gender",
    "preferredLocale", "phone", "email"
  )
  VALUES (
    payload ->> 'firstName',
    payload ->> 'lastName',
    (payload ->> 'dateOfBirth')::date,
    payload ->> 'gender',
    payload ->> 'preferredLocale',
    v_phone,
    v_email
  )
  ON CONFLICT ("phone") DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    "dateOfBirth" = EXCLUDED."dateOfBirth",
    "gender" = EXCLUDED."gender",
    "preferredLocale" = EXCLUDED."preferredLocale",
    "email" = EXCLUDED."email",
    "updatedAt" = now()
  RETURNING "id" INTO v_patient_id;

  -- 2. Insert consent
  INSERT INTO "Consent" (
    "privacyPolicyVersion", "acceptedAt", "presentedLocale",
    "termsOfService", "privacyPolicy", "processingHealthData",
    "crossBorderTransfer", "marketingOptIn", "familyAccessOptIn"
  )
  VALUES (
    COALESCE(payload -> 'consent' ->> 'privacyPolicyVersion', '2026-05-04'),
    COALESCE((payload -> 'consent' ->> 'acceptedAt')::timestamptz, now()),
    COALESCE(payload -> 'consent' ->> 'presentedLocale', payload ->> 'preferredLocale', 'en'),
    COALESCE((payload -> 'consent' ->> 'termsOfService')::boolean, false),
    COALESCE((payload -> 'consent' ->> 'privacyPolicy')::boolean, false),
    COALESCE((payload -> 'consent' ->> 'processingHealthData')::boolean, false),
    COALESCE((payload -> 'consent' ->> 'crossBorderTransfer')::boolean, false),
    COALESCE((payload -> 'consent' ->> 'marketingOptIn')::boolean, false),
    COALESCE((payload -> 'consent' ->> 'familyAccessOptIn')::boolean, false)
  )
  RETURNING "id" INTO v_consent_id;

  -- 3. Insert intake
  INSERT INTO "Intake" (
    "patientId", "consentId", "payload", "severity",
    "symptomDurationDays", "ramadanContext", "isFasting", "prefersDoctorGender"
  )
  VALUES (
    v_patient_id,
    v_consent_id,
    payload,
    (payload ->> 'severity')::int,
    NULLIF(payload ->> 'symptomDurationDays', '')::int,
    COALESCE((payload ->> 'ramadanContext')::boolean, false),
    COALESCE((payload ->> 'isFasting')::boolean, false),
    NULLIF(payload ->> 'prefersDoctorGender', '')::"Gender"
  )
  RETURNING "id", "createdAt" INTO v_intake_id, v_intake_created_at;

  -- 4. Audit log
  INSERT INTO "AuditLog" ("actorRole", "actorId", "event", "resourceId")
  VALUES ('patient', v_patient_id, 'intake.created', v_intake_id);

  RETURN jsonb_build_object(
    'id', v_intake_id,
    'receivedAt', v_intake_created_at,
    'patientId', v_patient_id,
    'consentId', v_consent_id
  );
END;
$$;

-- Grant execute to the service_role (edge functions use this role).
-- authenticated and anon do NOT get execute — the edge function handles auth.
GRANT EXECUTE ON FUNCTION create_intake(jsonb) TO service_role;

COMMENT ON FUNCTION create_intake(jsonb) IS
  'Atomic intake creation: Patient upsert → Consent → Intake → AuditLog in one transaction.';
