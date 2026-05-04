import { z } from 'zod';
import { LocaleSchema } from './common.js';

/**
 * Patient consent record. Required by GDPR Art. 6(1)(a) + Art. 9(2)(a)
 * (special-category health data) and Jordan PDPL 2023.
 *
 * Each consent flag is logged with the locale it was presented in,
 * so we can prove what the patient actually saw.
 */
export const ConsentSchema = z.object({
  privacyPolicyVersion: z.string().min(1),
  acceptedAt: z.string().datetime(),
  presentedLocale: LocaleSchema,
  termsOfService: z.literal(true, { message: 'Terms of Service must be accepted' }),
  privacyPolicy: z.literal(true, { message: 'Privacy Policy must be accepted' }),
  processingHealthData: z.literal(true, {
    message: 'Processing of health data (Art. 9 GDPR) must be explicitly accepted',
  }),
  crossBorderTransfer: z.literal(true, {
    message: 'Cross-border data transfer Jordan ↔ Germany must be acknowledged',
  }),
  marketingOptIn: z.boolean().optional().default(false),
  familyAccessOptIn: z.boolean().optional().default(false),
});

export type Consent = z.infer<typeof ConsentSchema>;
