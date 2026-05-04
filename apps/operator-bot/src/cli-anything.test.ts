import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { executeWithCliAnything } from './cli-anything.js';

const log = pino({ level: 'silent' });

describe('executeWithCliAnything', () => {
  it('returns the prompt verbatim in dry-run mode', async () => {
    const result = await executeWithCliAnything(
      { bin: 'cli-anything', dryRun: true },
      'do the thing',
      log,
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/dry-run/u);
    expect(result.stdout).toMatch(/do the thing/u);
    expect(result.ranBinary).toBe(false);
  });

  it('falls back gracefully when binary is missing', async () => {
    const result = await executeWithCliAnything(
      { bin: '/nonexistent/path/to/cli-anything', dryRun: false },
      'do the thing',
      log,
    );
    expect(result.ranBinary).toBe(false);
    expect(result.exitCode).toBe(-1);
    expect(result.stdout).toMatch(/no-cli/u);
  });
});
