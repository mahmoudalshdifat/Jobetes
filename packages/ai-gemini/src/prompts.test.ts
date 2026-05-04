import { describe, expect, it } from 'vitest';
import { buildTriagePrompt, TRIAGE_PROMPT_VERSION } from './prompts.js';
import type { TriageInput } from '@jobetes/shared-schemas';

const base: TriageInput = {
  primarySymptoms: ['heartburn_reflux'],
  severity: 4,
  currentMedications: ['omeprazole'],
  knownAllergies: [],
  knownConditions: [],
  preferredLocale: 'ar',
  ramadanContext: false,
};

describe('buildTriagePrompt', () => {
  it('returns version-tagged prompt for Arabic', () => {
    const out = buildTriagePrompt(base);
    expect(out.systemInstruction).toMatch(/Arabic/iu);
    expect(out.prompt).toMatch(/heartburn_reflux/u);
    expect(out.prompt).toMatch(/omeprazole/u);
    expect(TRIAGE_PROMPT_VERSION).toMatch(/v\d/u);
  });

  it('switches system instruction per locale', () => {
    const ar = buildTriagePrompt({ ...base, preferredLocale: 'ar' });
    const de = buildTriagePrompt({ ...base, preferredLocale: 'de' });
    const en = buildTriagePrompt({ ...base, preferredLocale: 'en' });
    expect(ar.systemInstruction).toMatch(/Arabic/iu);
    expect(de.systemInstruction).toMatch(/Deutsch|Sie-Form/iu);
    expect(en.systemInstruction).toMatch(/English|6th-grade/iu);
  });

  it('adds Ramadan note only when ramadanContext=true', () => {
    const off = buildTriagePrompt({ ...base, ramadanContext: false });
    const on = buildTriagePrompt({ ...base, ramadanContext: true });
    expect(off.systemInstruction).not.toMatch(/Ramadan/iu);
    expect(on.systemInstruction).toMatch(/Ramadan/iu);
  });

  it('falls back gracefully when arrays are empty', () => {
    const out = buildTriagePrompt({
      ...base,
      currentMedications: [],
      knownAllergies: [],
      knownConditions: [],
    });
    expect(out.prompt).toMatch(/none reported/u);
  });

  it('includes optional duration when provided', () => {
    const out = buildTriagePrompt({ ...base, symptomDurationDays: 14 });
    expect(out.prompt).toMatch(/14/u);
  });

  it('includes other-text when provided', () => {
    const out = buildTriagePrompt({
      ...base,
      symptomsOtherText: 'occasional tongue tingle',
    });
    expect(out.prompt).toMatch(/tongue tingle/u);
  });
});
