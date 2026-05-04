import { describe, expect, it } from 'vitest';
import { createIntakeRepo, InMemoryIntakeRepo, PrismaIntakeRepo } from './index.js';

describe('createIntakeRepo (factory)', () => {
  it('returns InMemoryIntakeRepo when DATABASE_URL is empty', () => {
    expect(createIntakeRepo('')).toBeInstanceOf(InMemoryIntakeRepo);
    expect(createIntakeRepo('   ')).toBeInstanceOf(InMemoryIntakeRepo);
  });

  it('returns PrismaIntakeRepo when DATABASE_URL is set', () => {
    // We don't actually connect; just verify the right class is constructed.
    expect(createIntakeRepo('postgresql://x')).toBeInstanceOf(PrismaIntakeRepo);
  });
});
