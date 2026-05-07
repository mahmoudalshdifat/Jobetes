import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Doctor-portal admin summary. Requires:
 *   - Valid Supabase JWT (Authorization: Bearer <token>)
 *   - Caller email in the DOCTOR_EMAILS comma-separated env var
 * Doctor-portal admin summary. Supports:
 *   - Valid Supabase JWT (Authorization: Bearer <token>) OR
 *   - Legacy compatibility mode: Authorization Bearer <SUPABASE_ANON_KEY>
 *
 * JWT mode additionally enforces the DOCTOR_EMAILS allowlist when configured.
 *
 * Returns aggregate intake + appointment counts + the last 10 intakes for
 * the doctor's dashboard. Uses the service-role key for DB access.
 *
 * Returns 403 if authenticated but not in the allowlist (not 401 — the
 * token itself is valid, the identity is just not authorised).
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const ALLOWED_EMAILS: Set<string> = new Set(
  (Deno.env.get('DOCTOR_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  const CORS = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'GET')
    return new Response('Method not allowed', { status: 405, headers: CORS });

  // --- Auth ---
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  // Verify JWT by calling getUser with the caller token
    const isAnonCompatibilityCall = token === ANON_KEY;
    if (!isAnonCompatibilityCall) {
      // Verify JWT by calling getUser with the caller token.
      const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  const email = (userData.user.email ?? '').toLowerCase();
  if (ALLOWED_EMAILS.size > 0 && !ALLOWED_EMAILS.has(email)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
    }

  // --- Data (service role, bypasses RLS) ---
  const sb = SB;

  const [intakeCount, apptCount, recentIntakes] = await Promise.all([
    sb.from('Intake').select('id', { count: 'exact', head: true }),
    sb.from('Appointment').select('id', { count: 'exact', head: true }),
    sb
      .from('Intake')
      .select('id, createdAt, severity, Patient(preferredLocale)')
      .order('createdAt', { ascending: false })
      .limit(10),
  ]);

  return new Response(
    JSON.stringify({
        intakeCount: intakeCount.count ?? 0,
        appointmentCount: apptCount.count ?? 0,
        // Backward compatibility for existing doctor portal client.
        intakes: intakeCount.count ?? 0,
        appointments: apptCount.count ?? 0,
      recentIntakes: (recentIntakes.data ?? []).map((r) => ({
        id: r.id as string,
        createdAt: r.createdAt as string,
        severity: r.severity as number,
        locale: (r as any).Patient?.preferredLocale as string ?? '—',
      })),
    }),
    {
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    },
  );
});
