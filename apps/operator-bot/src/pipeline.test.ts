import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { runPipeline } from './pipeline.js';
import type { BotConfig } from './config.js';

const log = pino({ level: 'silent' });

const baseCfg: BotConfig = {
  TELEGRAM_BOT_TOKEN: 'test-token',
  TELEGRAM_ALLOWED_USER_IDS: [42],
  GITHUB_PAT: '',
  GITHUB_REPO_OWNER: 'mahmoudalshdifat',
  GITHUB_REPO_NAME: 'Jobetes',
  GITHUB_CODESPACE_NAME: '',
  WAKEUP_WAIT_MS: 0,
  STT_PROVIDER: 'mock',
  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-2.0-flash',
  OPENAI_API_KEY: '',
  CLI_ANYTHING_BIN: 'cli-anything',
  EXECUTE_DRY_RUN: true,
};

describe('runPipeline (full mock)', () => {
  it('handles a text input end-to-end without external calls', async () => {
    const result = await runPipeline(baseCfg, log, {
      kind: 'text',
      text: 'add a button to the home page',
    });
    expect(result.rawText).toBe('add a button to the home page');
    expect(result.enhancedPrompt.length).toBeGreaterThan(0);
    expect(result.cliRanBinary).toBe(false);
    expect(result.cliStdout).toMatch(/dry-run/u);
    expect(result.codespaceAwoken).toBe(false);
    expect(result.codespaceReason).toMatch(/GITHUB_PAT|CODESPACE/u);
  });

  it('handles a voice input end-to-end with mock STT', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await runPipeline(baseCfg, log, { kind: 'voice', bytes });
    expect(result.rawText).toMatch(/mock-stt/u);
    expect(result.cliStdout).toMatch(/dry-run/u);
  });
});
