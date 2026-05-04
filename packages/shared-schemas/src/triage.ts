import { z } from 'zod';

export const TriageUrgencySchema = z.enum(['emergency', 'soon', 'routine', 'self_care_likely']);
export type TriageUrgency = z.infer<typeof TriageUrgencySchema>;

/**
 * Output from the AI triage. By design **non-diagnostic** — it suggests
 * urgency category and topics to discuss, not diagnoses.
 *
 * Phase 0 is intentionally a "limited-risk" AI Act feature.
 */
export const TriageResultSchema = z.object({
  urgency: TriageUrgencySchema,
  redFlags: z.array(z.string()),
  topicsForConsultation: z.array(z.string()),
  patientFriendlySummary: z.string(),
  disclaimer: z.string(),
  modelMeta: z.object({
    provider: z.string(),
    model: z.string(),
    promptVersion: z.string(),
    latencyMs: z.number().int().nonnegative(),
    tokensIn: z.number().int().nonnegative().optional(),
    tokensOut: z.number().int().nonnegative().optional(),
  }),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;
