import { afterEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import { wakeCodespace } from './codespace.js';

const log = pino({ level: 'silent' });
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('wakeCodespace', () => {
  it('skips when PAT is empty', async () => {
    const r = await wakeCodespace({ pat: '', codespaceName: 'cs-1', waitMs: 0 }, log);
    expect(r.awoken).toBe(false);
    expect(r.reason).toMatch(/PAT/u);
  });

  it('skips when codespace name is empty', async () => {
    const r = await wakeCodespace({ pat: 'gh_xxx', codespaceName: '', waitMs: 0 }, log);
    expect(r.awoken).toBe(false);
    expect(r.reason).toMatch(/CODESPACE/u);
  });

  it('returns awoken=true when GitHub responds 200', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('{}', { status: 200 }),
    ) as typeof fetch;
    const r = await wakeCodespace(
      { pat: 'gh_xxx', codespaceName: 'cs-1', waitMs: 0 },
      log,
    );
    expect(r.awoken).toBe(true);
  });

  it('reports reason when GitHub responds non-2xx', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('{"message":"not found"}', { status: 404 }),
    ) as typeof fetch;
    const r = await wakeCodespace(
      { pat: 'gh_xxx', codespaceName: 'missing', waitMs: 0 },
      log,
    );
    expect(r.awoken).toBe(false);
    expect(r.reason).toMatch(/404/u);
  });

  it('treats 304 (already running) as awoken', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 304 }),
    ) as typeof fetch;
    const r = await wakeCodespace(
      { pat: 'gh_xxx', codespaceName: 'cs-1', waitMs: 0 },
      log,
    );
    expect(r.awoken).toBe(true);
  });
});
