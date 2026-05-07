import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * Non-diagnostic AI triage. Two modes:
 *  - GEMINI_API_KEY set    → calls Gemini 2.0 Flash, returns model output
 *  - GEMINI_API_KEY empty  → deterministic mock (works without any key)
 *
 * Both paths return the same JSON shape so the web app does not branch.
 * Any provider failure falls back to mock so the API contract never breaks.
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

const DISCLAIMERS: Record<string, string> = {
  ar: 'هذه معلومات وليست تشخيصًا طبيًا. للحالات الطارئة اتصل بـ 911 (الأردن) أو 112 (ألمانيا).',
  de: 'Dies ist eine Information, keine Diagnose. Im Notfall wählen Sie 112 (Deutschland) oder 911 (Jordanien).',
  en: 'This is information, not a medical diagnosis. In emergencies call 911 (Jordan) or 112 (Germany).',
};

function validate(b: any): string | null {
  if (!b || typeof b !== 'object') return 'body must be JSON';
  if (!Array.isArray(b.primarySymptoms) || !b.primarySymptoms.length)
    return 'primarySymptoms required';
  if (typeof b.severity !== 'number' || b.severity < 0 || b.severity > 10)
    return 'severity 0..10';
  if (!['ar', 'de', 'en'].includes(b.preferredLocale)) return 'preferredLocale ar|de|en';
  return null;
}

function mockResult(input: any) {
  const locale = input.preferredLocale ?? 'en';
  return {
    urgency: input.severity >= 8 ? 'soon' : 'routine',
    redFlags: [],
    topicsForConsultation: [
      'review of current symptoms with the gastroenterologist',
      'discussion of medication and allergies history',
    ],
    patientFriendlySummary:
      '[mock] Based on the information provided, a non-urgent consultation is recommended. The doctor will discuss your symptoms in detail.',
    disclaimer: DISCLAIMERS[locale],
    modelMeta: {
      provider: 'mock',
      model: 'mock-deterministic-v1',
      promptVersion: '2026-05-04.v1',
      latencyMs: 1,
    },
  };
}

async function geminiResult(input: any, apiKey: string) {
  const start = Date.now();
  const locale = input.preferredLocale ?? 'en';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const systemInstruction = `You are a triage assistant. You are NOT a doctor and DO NOT diagnose. Suggest urgency category and topics to discuss. Red flags (severe pain, blood, weight loss, jaundice, vomiting blood, syncope) → urgency=emergency. Be concise, kind, culturally respectful. Respond in ${locale}.`;
  const prompt = [
    'Patient summary:',
    `- Symptoms: ${input.primarySymptoms.join(', ')}`,
    input.symptomsOtherText ? `- Other: ${input.symptomsOtherText}` : '',
    `- Severity (0-10): ${input.severity}`,
    `- Medications: ${(input.currentMedications ?? []).join(', ') || 'none'}`,
    `- Allergies: ${(input.knownAllergies ?? []).join(', ') || 'none'}`,
    `- Conditions: ${(input.knownConditions ?? []).join(', ') || 'none'}`,
    input.ramadanContext ? '- Patient is in Ramadan; account for fasting.' : '',
    '',
    'Return ONLY a JSON object: { urgency: "emergency"|"soon"|"routine"|"self_care_likely", redFlags: string[], topicsForConsultation: string[], patientFriendlySummary: string, disclaimer: string }',
  ]
    .filter(Boolean)
    .join('\n');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep empty */
  }
  return {
    urgency: parsed.urgency ?? 'routine',
    redFlags: parsed.redFlags ?? [],
    topicsForConsultation: parsed.topicsForConsultation ?? [],
    patientFriendlySummary: parsed.patientFriendlySummary ?? '',
    disclaimer: DISCLAIMERS[locale],
    modelMeta: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      promptVersion: '2026-05-04.v1',
      latencyMs: Date.now() - start,
      tokensIn: data.usageMetadata?.promptTokenCount,
      tokensOut: data.usageMetadata?.candidatesTokenCount,
    },
  };
}

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
    return new Response(JSON.stringify({ error: 'invalid_triage_input', detail: err }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });

  const key = Deno.env.get('GEMINI_API_KEY') ?? '';
  try {
    const result = key ? await geminiResult(body, key) : mockResult(body);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch {
    const fallback = mockResult(body);
    fallback.modelMeta.model = 'fallback-after-error';
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
