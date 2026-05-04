import { describe, expect, it } from 'vitest';
import type { TriageInput } from '@jobetes/shared-schemas';
import { createGeminiProvider } from './provider.js';
import { runTriage } from './triage.js';
import { enhancePrompt } from './prompt-enhancer.js';

const sampleInput: TriageInput = {
  primarySymptoms: ['heartburn_reflux'],
  severity: 4,
  currentMedications: ['omeprazole'],
  knownAllergies: [],
  knownConditions: [],
  preferredLocale: 'ar',
  ramadanContext: false,
};

describe('runTriage with mock provider (no API key)', () => {
  it('returns a schema-valid TriageResult', async () => {
    const provider = createGeminiProvider({ apiKey: '' });
    const result = await runTriage(provider, sampleInput);
    expect(result.urgency).toBe('routine');
    expect(result.disclaimer).toMatch(/911|112|طارئ|Notfall|emergency/iu);
    expect(result.modelMeta.provider).toBe('mock');
    expect(result.topicsForConsultation.length).toBeGreaterThan(0);
  });

  it('embeds the locale-specific disclaimer', async () => {
    const provider = createGeminiProvider({ apiKey: '' });
    const ar = await runTriage(provider, { ...sampleInput, preferredLocale: 'ar' });
    const de = await runTriage(provider, { ...sampleInput, preferredLocale: 'de' });
    const en = await runTriage(provider, { ...sampleInput, preferredLocale: 'en' });
    expect(ar.disclaimer).toMatch(/911|طارئ/u);
    expect(de.disclaimer).toMatch(/112/u);
    expect(en.disclaimer).toMatch(/911/u);
  });
});

describe('runTriage with malformed model output', () => {
  it('falls back gracefully on non-JSON response', async () => {
    const broken = {
      async generate() {
        return {
          text: 'this is not json at all, just prose from a model',
          modelMeta: { provider: 'mock' as const, model: 'broken', latencyMs: 1 },
        };
      },
    };
    const result = await runTriage(broken, sampleInput);
    expect(result.urgency).toBe('routine');
    expect(result.disclaimer).toMatch(/طارئ|911/u);
    expect(result.topicsForConsultation.length).toBeGreaterThan(0);
  });

  it('fills missing fields from partial JSON', async () => {
    const partial = {
      async generate() {
        return {
          text: JSON.stringify({ urgency: 'soon' }),
          modelMeta: { provider: 'mock' as const, model: 'partial', latencyMs: 1 },
        };
      },
    };
    const result = await runTriage(partial, { ...sampleInput, preferredLocale: 'de' });
    expect(result.urgency).toBe('soon');
    expect(result.disclaimer).toMatch(/112/u);
    expect(result.redFlags).toEqual([]);
    expect(result.topicsForConsultation).toEqual([]);
  });
});

describe('enhancePrompt with mock provider', () => {
  it('rewrites a raw input', async () => {
    const provider = createGeminiProvider({ apiKey: '' });
    const result = await enhancePrompt(provider, 'add a button on home page');
    expect(result.original).toBe('add a button on home page');
    expect(result.enhanced.length).toBeGreaterThan(0);
    expect(result.modelMeta.provider).toBe('mock');
  });

  it('rejects empty input', async () => {
    const provider = createGeminiProvider({ apiKey: '' });
    await expect(enhancePrompt(provider, '   ')).rejects.toThrow(/empty/iu);
  });
});
