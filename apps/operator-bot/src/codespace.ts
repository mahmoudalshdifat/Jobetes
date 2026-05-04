import type { Logger } from 'pino';

/**
 * Wake a GitHub Codespace by name. Uses GitHub REST API:
 *   POST /user/codespaces/{name}/start
 *
 * Requires a PAT with `codespace` scope. If `pat` is empty, no-ops.
 *
 * After starting, the bot waits `waitMs` for the dev environment to come up.
 */
export async function wakeCodespace(
  cfg: { pat: string; codespaceName: string; waitMs: number },
  log: Logger,
): Promise<{ awoken: boolean; reason?: string }> {
  if (!cfg.pat) return { awoken: false, reason: 'no GITHUB_PAT configured' };
  if (!cfg.codespaceName) return { awoken: false, reason: 'no GITHUB_CODESPACE_NAME configured' };

  const url = `https://api.github.com/user/codespaces/${encodeURIComponent(cfg.codespaceName)}/start`;
  log.info({ url }, 'waking codespace');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.pat}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok && res.status !== 304) {
    const body = await res.text();
    log.error({ status: res.status, body }, 'codespace wake failed');
    return { awoken: false, reason: `HTTP ${res.status}` };
  }

  log.info({ waitMs: cfg.waitMs }, 'codespace awoken — waiting for environment');
  await new Promise((r) => setTimeout(r, cfg.waitMs));
  return { awoken: true };
}
