import type { DoctorProfile } from '@jobetes/shared-schemas';

/**
 * Source of truth for the doctor profile shown in the app.
 * Values verified against https://www.annahospital.de/klinik-fuer-gastroenterologie/team.html
 * (LinkedIn URL given in the brief returned 404 — using hospital page as canonical source).
 *
 * Update process: any change to credentials must be validated against
 * the public hospital page and recorded in `compliance/RECORDS_OF_PROCESSING.md`
 * because the bio is patient-facing.
 */
export const DOCTOR_PROFILE: DoctorProfile = {
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
