import { describe, expect, it } from 'vitest';
import { loadBotConfig } from './config.js';

describe('loadBotConfig', () => {
  it('parses a minimal valid env', () => {
    const cfg = loadBotConfig({
      TELEGRAM_BOT_TOKEN: 'abc',
      TELEGRAM_ALLOWED_USER_IDS: '12345,67890',
    } as NodeJS.ProcessEnv);
    expect(cfg.TELEGRAM_BOT_TOKEN).toBe('abc');
    expect(cfg.TELEGRAM_ALLOWED_USER_IDS).toEqual([12345, 67890]);
  });

  it('rejects empty allowlist', () => {
    expect(() =>
      loadBotConfig({
        TELEGRAM_BOT_TOKEN: 'abc',
        TELEGRAM_ALLOWED_USER_IDS: '',
      } as NodeJS.ProcessEnv),
    ).toThrow();
  });

  it('rejects missing token', () => {
    expect(() =>
      loadBotConfig({ TELEGRAM_ALLOWED_USER_IDS: '1' } as NodeJS.ProcessEnv),
    ).toThrow();
  });
});
