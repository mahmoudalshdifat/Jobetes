import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const PROFILE = {
  fullName: 'Dr. med. Mahmoud Al-Shdaifat',
  title: 'Oberarzt — Klinik für Gastroenterologie',
  hospital: 'St. Anna Hospital Herne',
  hospitalUrl: 'https://www.annahospital.de/klinik-fuer-gastroenterologie/team.html',
  city: 'Herne',
  countryCode: 'DE',
  languages: ['de', 'en', 'ar'],
  credentials: [
    { label: 'Facharzt für Innere Medizin und Gastroenterologie' },
    { label: 'Diabetologe DDG / ÄKWL' },
    { label: 'Notfallmedizin' },
    { label: 'Wundtherapie ICW' },
  ],
  specialties: [
    'Gastroskopie und Koloskopie',
    'Chronisch entzündliche Darmerkrankungen',
    'Diabetes-Mellitus-Begleitung',
    'Hepatologie',
    'Notfallmedizin',
  ],
  bio: {
    de: 'Dr. Al-Shdaifat ist Oberarzt der gastroenterologischen Klinik am St. Anna Hospital Herne. Seine Schwerpunkte sind diagnostische und therapeutische Endoskopie, chronisch entzündliche Darmerkrankungen und die Begleitung von Patient*innen mit Diabetes mellitus und Komorbiditäten.',
    en: 'Dr. Al-Shdaifat is a senior physician at the gastroenterology clinic of St. Anna Hospital Herne. His focus is diagnostic and therapeutic endoscopy, inflammatory bowel disease, and care of patients with diabetes mellitus and complex comorbidities.',
    ar: 'الدكتور الشديفات طبيب أول في عيادة أمراض الجهاز الهضمي في مستشفى سانت آنا في هيرنه. اختصاصه التنظير التشخيصي والعلاجي، أمراض الأمعاء الالتهابية المزمنة، ورعاية مرضى السكري ذوي الحالات المعقدة.',
  },
};

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

Deno.serve((req) => {
  const CORS = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: CORS });
  return new Response(JSON.stringify(PROFILE), {
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  });
});
