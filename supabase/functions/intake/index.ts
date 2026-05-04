import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Patient intake — public POST endpoint.
 *
 * Validates the body, then performs Patient upsert (by phone) +
 * Consent insert + Intake insert + AuditLog insert. Service-role key is
 * used so the function can write past RLS once it's enabled.
 *
 * Mirrors the contract at apps/api/src/routes/intake.ts so the React app
 * can call either backend with the same payload.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REQUIRED = [
  'firstName', 'lastName', 'dateOfBirth', 'gender', 'preferredLocale',
  'phone', 'primarySymptoms', 'severity', 'consent',
] as const;

const CONSENT_FLAGS = [
  'termsOfService', 'privacyPolicy', 'processingHealthData', 'crossBorderTransfer',
] as const;

function validate(body: any): string | null {
  if (!body || typeof body !== 'object') return 'body must be JSON object';
  for (const k of REQUIRED) if (body[k] === undefined) return `missing field: ${k}`;
  if (!Array.isArray(body.primarySymptoms) || body.primarySymptoms.length === 0)
    return 'primarySymptoms must be a non-empty array';
  if (typeof body.severity !== 'number' || body.severity < 0 || body.severity > 10)
    return 'severity must be 0..10';
  if (!/^\+\d{6,16}$/.test(body.phone)) return 'phone must be E.164';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) return 'dateOfBirth must be YYYY-MM-DD';
  if (!body.consent || typeof body.consent !== 'object') return 'consent missing';
  for (const f of CONSENT_FLAGS) if (body.consent[f] !== true) return `consent.${f} must be true`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405, headers: CORS });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  const err = validate(body);
  if (err)
    return new Response(JSON.stringify({ error: 'invalid_intake', detail: err }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: patient, error: pErr } = await sb
    .from('Patient')
    .upsert(
      {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        preferredLocale: body.preferredLocale,
        phone: body.phone,
        email: body.email ?? null,
      },
      { onConflict: 'phone' },
    )
    .select('id')
    .single();
  if (pErr)
    return new Response(JSON.stringify({ error: 'db_patient', detail: pErr.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  const { data: consent, error: cErr } = await sb
    .from('Consent')
    .insert({
      privacyPolicyVersion: body.consent.privacyPolicyVersion ?? '2026-05-04',
      acceptedAt: body.consent.acceptedAt ?? new Date().toISOString(),
      presentedLocale: body.consent.presentedLocale ?? body.preferredLocale,
      termsOfService: body.consent.termsOfService,
      privacyPolicy: body.consent.privacyPolicy,
      processingHealthData: body.consent.processingHealthData,
      crossBorderTransfer: body.consent.crossBorderTransfer,
      marketingOptIn: body.consent.marketingOptIn ?? false,
      familyAccessOptIn: body.consent.familyAccessOptIn ?? false,
    })
    .select('id')
    .single();
  if (cErr)
    return new Response(JSON.stringify({ error: 'db_consent', detail: cErr.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  const { data: intake, error: iErr } = await sb
    .from('Intake')
    .insert({
      patientId: patient.id,
      consentId: consent.id,
      payload: body,
      severity: body.severity,
      symptomDurationDays: body.symptomDurationDays ?? null,
      ramadanContext: body.ramadanContext ?? false,
      isFasting: body.isFasting ?? false,
      prefersDoctorGender: body.prefersDoctorGender ?? null,
    })
    .select('id, createdAt')
    .single();
  if (iErr)
    return new Response(JSON.stringify({ error: 'db_intake', detail: iErr.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  await sb.from('AuditLog').insert({
    actorRole: 'patient',
    actorId: patient.id,
    event: 'intake.created',
    resourceId: intake.id,
  });

  return new Response(JSON.stringify({ id: intake.id, receivedAt: intake.createdAt }), {
    status: 201,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
