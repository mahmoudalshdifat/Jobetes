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

const ALLOWED_ORIGINS = [
  'https://jobetes.diggai.de',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const CORS = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405, headers: CORS });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
  const err = validate(body);
  if (err)
    return new Response(JSON.stringify({ error: 'invalid_intake', detail: err }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });

  const sb = SB;

  // Atomic intake creation via PostgreSQL RPC — replaces sequential inserts
  // with a single transaction. See migration: 20260506194000_atomic_intake_function.sql
  const { data: result, error: rpcErr } = await sb.rpc('create_intake', { payload: body });
  if (rpcErr) {
    return new Response(JSON.stringify({ error: 'db_intake', detail: rpcErr.message }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
  const intake = result as { id: string; receivedAt: string; patientId: string; consentId: string };

  // Fire-and-forget patient confirmation email — never blocks the response.
  // notify-patient gracefully no-ops if RESEND_API_KEY / email are missing.
  if (body.email) {
    const notifyUrl = `${SUPABASE_URL}/functions/v1/notify-patient`;
    void fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        firstName: body.firstName,
        email: body.email,
        preferredLocale: body.preferredLocale ?? 'en',
      }),
    }).catch((err) => console.warn('[intake] notify-patient call failed:', err));
  }

  return new Response(JSON.stringify({ id: intake.id, receivedAt: intake.createdAt }), {
    status: 201,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
});
