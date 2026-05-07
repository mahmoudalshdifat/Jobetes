import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * notify-patient — sends a confirmation email after a patient submits an intake.
 *
 * Called internally by the `intake` edge function via a background fetch.
 * Requires:
 *   RESEND_API_KEY — Resend.com API key (EU-region account recommended)
 *   FROM_EMAIL     — verified sender address, e.g. "noreply@jobetes.health"
 *
 * If either env var is missing, the function logs a warning and returns 200
 * (graceful no-op) so intake submissions always succeed.
 *
 * Privacy notes:
 *   - Only patient's first name and preferred locale are used here.
 *   - No health data or consent payload is forwarded to Resend.
 *   - Email body is locale-specific (AR/DE/EN).
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

const SUBJECTS: Record<string, string> = {
  ar: 'تأكيد استلام طلبك — جوبيتس',
  de: 'Eingangsbestätigung — Jobetes',
  en: 'We received your request — Jobetes',
};

const BODIES: Record<string, (name: string) => string> = {
  ar: (name) =>
    `مرحباً ${name}،\n\nشكراً لتقديمك طلبك. سيتواصل معك الدكتور محمود الشديفات في غضون 48 ساعة.\n\nتذكير: هذا ليس تشخيصاً طبياً. في حالات الطوارئ اتصل بـ 911 (الأردن) أو 112 (ألمانيا).\n\nمع تحياتنا،\nفريق جوبيتس`,
  de: (name) =>
    `Guten Tag ${name},\n\nvielen Dank für Ihre Anfrage. Dr. Mahmoud Al-Shdaifat wird sich innerhalb von 48 Stunden bei Ihnen melden.\n\nBitte beachten Sie: Dies ist keine medizinische Diagnose. Im Notfall wählen Sie 112 (Deutschland) oder 911 (Jordanien).\n\nMit freundlichen Grüßen,\nDas Jobetes-Team`,
  en: (name) =>
    `Hello ${name},\n\nThank you for submitting your request. Dr. Mahmoud Al-Shdaifat will be in touch within 48 hours.\n\nReminder: This is not a medical diagnosis. In emergencies call 911 (Jordan) or 112 (Germany).\n\nBest regards,\nThe Jobetes Team`,
};

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders(req) });

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL');

  if (!resendApiKey || !fromEmail) {
    console.warn('[notify-patient] RESEND_API_KEY or FROM_EMAIL not configured — skipping email');
    return json(req, { skipped: true, reason: 'email_not_configured' });
  }

  let body: { firstName?: string; email?: string; preferredLocale?: string };
  try {
    body = await req.json();
  } catch {
    return json(req, { error: 'invalid_json' }, 400);
  }

  const { firstName = 'there', email, preferredLocale = 'en' } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // No email provided — silently skip (phone-only intake is valid).
    return json(req, { skipped: true, reason: 'no_valid_email' });
  }

  const locale = ['ar', 'de', 'en'].includes(preferredLocale) ? preferredLocale : 'en';
  const subject = SUBJECTS[locale];
  const text = BODIES[locale](firstName);

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject,
      text,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error(`[notify-patient] Resend API error ${resendRes.status}: ${errBody}`);
    return json(req, { error: 'email_send_failed' }, 502);
  }

  const result = await resendRes.json();
  return json({ sent: true, messageId: result.id });
});
