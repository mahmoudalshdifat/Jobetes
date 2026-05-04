import { createGeminiProvider, enhancePrompt } from '@jobetes/ai-gemini';
import type { Logger } from 'pino';
import type { BotConfig } from './config.js';
import { wakeCodespace } from './codespace.js';
import { executeWithCliAnything } from './cli-anything.js';
import { transcribeAudio } from './stt.js';

export type PipelineInput =
  | { kind: 'text'; text: string }
  | { kind: 'voice'; bytes: Uint8Array; mimeType?: string };

export type PipelineResult = {
  rawText: string;
  enhancedPrompt: string;
  cliStdout: string;
  cliStderr: string;
  cliExitCode: number;
  cliRanBinary: boolean;
  codespaceAwoken: boolean;
  codespaceReason?: string;
  durationMs: number;
};

/**
 * The end-to-end operator pipeline:
 *   1. wake codespace (and wait WAKEUP_WAIT_MS)
 *   2. STT if voice
 *   3. enhance prompt via Gemini
 *   4. execute via CLI-Anything (or mock-fallback)
 */
export async function runPipeline(
  cfg: BotConfig,
  log: Logger,
  input: PipelineInput,
): Promise<PipelineResult> {
  const start = Date.now();

  const wake = await wakeCodespace(
    {
      pat: cfg.GITHUB_PAT,
      codespaceName: cfg.GITHUB_CODESPACE_NAME,
      waitMs: cfg.WAKEUP_WAIT_MS,
    },
    log,
  );

  let rawText: string;
  if (input.kind === 'text') {
    rawText = input.text;
  } else {
    rawText = await transcribeAudio(cfg, input.bytes, input.mimeType);
  }

  const provider = createGeminiProvider({ apiKey: cfg.GEMINI_API_KEY, model: cfg.GEMINI_MODEL });
  const enhanced = await enhancePrompt(provider, rawText);

  const cli = await executeWithCliAnything(
    { bin: cfg.CLI_ANYTHING_BIN, dryRun: cfg.EXECUTE_DRY_RUN },
    enhanced.enhanced,
    log,
  );

  return {
    rawText,
    enhancedPrompt: enhanced.enhanced,
    cliStdout: cli.stdout,
    cliStderr: cli.stderr,
    cliExitCode: cli.exitCode,
    cliRanBinary: cli.ranBinary,
    codespaceAwoken: wake.awoken,
    codespaceReason: wake.reason,
    durationMs: Date.now() - start,
  };
}
