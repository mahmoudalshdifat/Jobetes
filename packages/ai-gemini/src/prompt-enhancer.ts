import { PROMPT_ENHANCER_SYSTEM } from './prompts.js';
import type { AiProvider } from './provider.js';

export type EnhancedPrompt = {
  original: string;
  enhanced: string;
  modelMeta: {
    provider: string;
    model: string;
    latencyMs: number;
  };
};

export async function enhancePrompt(
  provider: AiProvider,
  rawInput: string,
): Promise<EnhancedPrompt> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Prompt enhancer received empty input');
  }
  const result = await provider.generate({
    systemInstruction: PROMPT_ENHANCER_SYSTEM,
    prompt: trimmed,
  });
  return {
    original: trimmed,
    enhanced: result.text.trim(),
    modelMeta: {
      provider: result.modelMeta.provider,
      model: result.modelMeta.model,
      latencyMs: result.modelMeta.latencyMs,
    },
  };
}
