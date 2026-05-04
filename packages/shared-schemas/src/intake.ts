import { z } from 'zod';
import {
  EmailSchema,
  GenderSchema,
  IsoDateSchema,
  LocaleSchema,
  NonEmptyStringSchema,
  PhoneSchema,
} from './common.js';
import { ConsentSchema } from './consent.js';

/**
 * GI-specific symptom catalog. Kept short (Hick's Law).
 * Free-text "other" is the escape hatch.
 */
export const GiSymptomSchema = z.enum([
  'abdominal_pain',
  'heartburn_reflux',
  'bloating',
  'nausea_vomiting',
  'diarrhea',
  'constipation',
  'blood_in_stool',
  'unintentional_weight_loss',
  'difficulty_swallowing',
  'jaundice',
  'other',
]);
export type GiSymptom = z.infer<typeof GiSymptomSchema>;

export const SeverityScaleSchema = z.number().int().min(0).max(10);

export const PatientIntakeSchema = z.object({
  // Step 1 — identity (minimal, GDPR Art. 5(1)(c) data minimization)
  firstName: NonEmptyStringSchema.max(120),
  lastName: NonEmptyStringSchema.max(120),
  dateOfBirth: IsoDateSchema,
  gender: GenderSchema,
  preferredLocale: LocaleSchema,
  phone: PhoneSchema,
  email: EmailSchema.optional(),

  // Step 2 — clinical context (no diagnosis, just description)
  primarySymptoms: z.array(GiSymptomSchema).min(1).max(11),
  symptomsOtherText: z.string().trim().max(500).optional(),
  symptomDurationDays: z.number().int().nonnegative().max(365 * 5).optional(),
  severity: SeverityScaleSchema,
  currentMedications: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  knownAllergies: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  knownConditions: z.array(z.string().trim().min(1).max(200)).max(30).default([]),

  // Step 3 — Jordan-specific cultural context
  prefersDoctorGender: GenderSchema.optional(),
  isFasting: z.boolean().default(false),
  ramadanContext: z.boolean().default(false),

  // Step 4 — consent
  consent: ConsentSchema,
});

export type PatientIntake = z.infer<typeof PatientIntakeSchema>;

/**
 * Minimal subset emitted to the AI triage prompt (no PII).
 */
export const TriageInputSchema = PatientIntakeSchema.pick({
  primarySymptoms: true,
  symptomsOtherText: true,
  symptomDurationDays: true,
  severity: true,
  currentMedications: true,
  knownAllergies: true,
  knownConditions: true,
  preferredLocale: true,
  ramadanContext: true,
});
export type TriageInput = z.infer<typeof TriageInputSchema>;
