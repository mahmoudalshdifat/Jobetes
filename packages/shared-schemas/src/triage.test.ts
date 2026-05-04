import { describe, expect, it } from 'vitest';
import { TriageResultSchema, TriageUrgencySchema } from './triage.js';

const valid = {
  urgency: 'routine',
  redFlags: [],
  topicsForConsultation: ['t1'],
  patientFriendlySummary: 's',
  disclaimer: 'd',
  modelMeta: {
    provider: 'mock',
    model: 'm',
    promptVersion: '1',
    latencyMs: 10,
  },
};

describe('TriageResultSchema', () => {
  it('accepts a valid result', () => {
    expect(() => TriageResultSchema.parse(valid)).not.toThrow();
  });

  it('accepts every urgency category', () => {
    for (const u of ['emergency', 'soon', 'routine', 'self_care_likely'] as const) {
      expect(() => TriageUrgencySchema.parse(u)).not.toThrow();
    }
  });

  it('rejects unknown urgency', () => {
    expect(() => TriageResultSchema.parse({ ...valid, urgency: 'maybe' })).toThrow();
  });

  it('rejects negative latencyMs', () => {
    expect(() =>
      TriageResultSchema.parse({
        ...valid,
        modelMeta: { ...valid.modelMeta, latencyMs: -1 },
      }),
    ).toThrow();
  });
});
