import type { Locale, TriageInput } from '@jobetes/shared-schemas';

export const TRIAGE_PROMPT_VERSION = '2026-05-04.v1';

const SAFETY_PREAMBLE = `You are a triage assistant for Dr. Mahmoud Al-Shdaifat's
gastroenterology practice. You are NOT a doctor. You DO NOT diagnose.
You suggest an urgency category and topics the patient should discuss
with the doctor. If any "red flag" appears (severe pain, blood in stool,
weight loss, jaundice, vomiting blood, syncope, signs of shock), classify
as "emergency" and tell the patient to call emergency services immediately
(112 in Germany, 911 in Jordan). Be concise, kind, and culturally respectful.
Always remind the patient that this is informational and not a diagnosis.`;

const LOCALE_INSTRUCTION: Record<Locale, string> = {
  ar: 'Respond in clear Modern Standard Arabic. Use second-person singular politely.',
  de: 'Antworte in klarem, formellem Deutsch (Sie-Form).',
  en: 'Respond in plain English at a 6th-grade reading level.',
};

export function buildTriagePrompt(input: TriageInput): {
  systemInstruction: string;
  prompt: string;
} {
  const localeInstruction = LOCALE_INSTRUCTION[input.preferredLocale];
  const ramadanHint = input.ramadanContext
    ? 'Note: the patient is in Ramadan. Take fasting timing into account when discussing medication or procedure preparation.'
    : '';
  const systemInstruction = `${SAFETY_PREAMBLE}\n\n${localeInstruction}\n\n${ramadanHint}`.trim();

  const prompt = [
    'Patient summary (de-identified):',
    `- Primary symptoms: ${input.primarySymptoms.join(', ')}`,
    input.symptomsOtherText ? `- Other: ${input.symptomsOtherText}` : '',
    input.symptomDurationDays !== undefined
      ? `- Duration (days): ${input.symptomDurationDays}`
      : '',
    `- Severity (0-10): ${input.severity}`,
    `- Current medications: ${input.currentMedications.join(', ') || 'none reported'}`,
    `- Known allergies: ${input.knownAllergies.join(', ') || 'none reported'}`,
    `- Known conditions: ${input.knownConditions.join(', ') || 'none reported'}`,
    '',
    'Return ONLY a JSON object that matches this TypeScript type:',
    `{
  "urgency": "emergency" | "soon" | "routine" | "self_care_likely",
  "redFlags": string[],
  "topicsForConsultation": string[],
  "patientFriendlySummary": string,
  "disclaimer": string
}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { systemInstruction, prompt };
}

export const PROMPT_ENHANCER_SYSTEM = `You are a prompt enhancer. The user is
Dr. Mahmoud Al-Shdaifat (a gastroenterologist) issuing instructions to an
autonomous coding agent. Take his raw German/English/Arabic instruction —
which may have been transcribed from voice and may be terse or contain
typos — and rewrite it as a precise, scoped, unambiguous English prompt for
the coding agent. Preserve the doctor's intent exactly; do not add features
he did not ask for. Output ONLY the rewritten prompt, no commentary.`;
