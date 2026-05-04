import { spawn } from 'node:child_process';
import type { Logger } from 'pino';

/**
 * Execute an enhanced prompt via "CLI-Anything" (HKUDS).
 *
 * Behavior:
 *  - If `dryRun` is true OR the binary is not installed, returns the prompt
 *    as the simulated stdout (so the pipeline remains observable in dev).
 *  - Otherwise spawns `<bin> <args> --json` and captures stdout/stderr.
 *
 * The CLI-Anything binary is installed via `pip install cli-anything-hub`
 * and exposes per-app subcommands like `cli-anything-gimp`, `cli-anything-blender`.
 * The doctor's prompt is forwarded as a single quoted argument; downstream
 * adapters interpret it.
 */
export async function executeWithCliAnything(
  cfg: { bin: string; dryRun: boolean },
  enhancedPrompt: string,
  log: Logger,
): Promise<{ stdout: string; stderr: string; exitCode: number; ranBinary: boolean }> {
  if (cfg.dryRun) {
    log.info({ enhancedPrompt }, 'dry-run: skipping CLI execution');
    return { stdout: '[dry-run] ' + enhancedPrompt, stderr: '', exitCode: 0, ranBinary: false };
  }

  return new Promise((resolve) => {
    const proc = spawn(cfg.bin, ['--json', enhancedPrompt], {
      env: process.env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    proc.on('error', (err) => {
      log.warn({ err: err.message }, 'CLI-Anything binary not available — returning prompt only');
      resolve({
        stdout: '[no-cli] ' + enhancedPrompt,
        stderr: err.message,
        exitCode: -1,
        ranBinary: false,
      });
    });
    proc.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
        ranBinary: true,
      });
    });
  });
}
