import {
  type TriageInput,
  TriageResultSchema,
  type TriageResult,
} from '@jobetes/shared-schemas';
import { buildTriagePrompt, TRIAGE_PROMPT_VERSION } from './prompts.js';
import type { AiProvider } from './provider.js';

const DISCLAIMERS: Record<TriageInput['preferredLocale'], string> = {
  ar: 'هذه معلومات وليست تشخيصًا طبيًا. للحالات الطارئة اتصل بـ 911 (الأردن) أو 112 (ألمانيا).',
  de: 'Dies ist eine Information, keine Diagnose. Im Notfall wählen Sie 112 (Deutschland) oder 911 (Jordanien).',
  en: 'This is information, not a medical diagnosis. In emergencies call 911 (Jordan) or 112 (Germany).',
};

export async function runTriage(
  provider: AiProvider,
  input: TriageInput,
): Promise<TriageResult> {
  const { systemInstruction, prompt } = buildTriagePrompt(input);
  const response = await provider.generate({
    systemInstruction,
    prompt,
    jsonMode: true,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    parsed = {
      urgency: 'routine',
      redFlags: [],
      topicsForConsultation: ['Could not parse model output — please consult the doctor directly.'],
      patientFriendlySummary: response.text.slice(0, 280),
      disclaimer: DISCLAIMERS[input.preferredLocale],
    };
  }

  const partial = parsed as Record<string, unknown>;
  // Always overwrite the disclaimer — we control the legal text, not the model.
  partial.disclaimer = DISCLAIMERS[input.preferredLocale];

  return TriageResultSchema.parse({
    urgency: partial.urgency ?? 'routine',
    redFlags: partial.redFlags ?? [],
    topicsForConsultation: partial.topicsForConsultation ?? [],
    patientFriendlySummary: partial.patientFriendlySummary ?? '',
    disclaimer: partial.disclaimer,
    modelMeta: {
      provider: response.modelMeta.provider,
      model: response.modelMeta.model,
      promptVersion: TRIAGE_PROMPT_VERSION,
      latencyMs: response.modelMeta.latencyMs,
      tokensIn: response.modelMeta.tokensIn,
      tokensOut: response.modelMeta.tokensOut,
    },
  });
}
