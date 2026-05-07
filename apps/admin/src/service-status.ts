/**
 * Edge-function liveness pinger. Extracted from App.tsx so unit tests can
 * exercise the success/error/non-2xx/missing-URL paths without standing
 * up the full React tree.
 */

export type ServiceStatus = { name: string; ok: boolean; latencyMs: number };

export const PUBLIC_FUNCTIONS = ['health', 'doctor-profile', 'triage'] as const;
export type PublicFunctionName = (typeof PUBLIC_FUNCTIONS)[number];

/** Methods we use to ping each function — GET for read endpoints, OPTIONS otherwise. */
function methodFor(name: string): 'GET' | 'OPTIONS' {
  return name === 'health' || name === 'doctor-profile' ? 'GET' : 'OPTIONS';
}

/**
 * Ping a single edge function. Returns `ok: true` when the response is 2xx
 * OR 405 (the function exists, just doesn't accept the method) — both
 * imply the function is alive.
 *
 * `supabaseUrl` is passed in (rather than read from env) so tests can
 * stub it cleanly.
 */
export async function pingFunction(
  name: string,
  supabaseUrl: string | undefined,
  fetchImpl: typeof fetch = fetch,
  now: () => number = () => performance.now(),
): Promise<ServiceStatus> {
  if (!supabaseUrl) return { name, ok: false, latencyMs: -1 };
  const start = now();
  try {
    const res = await fetchImpl(`${supabaseUrl}/functions/v1/${name}`, {
      method: methodFor(name),
    });
    return {
      name,
      ok: res.ok || res.status === 405,
      latencyMs: Math.round(now() - start),
    };
  } catch {
    return { name, ok: false, latencyMs: Math.round(now() - start) };
  }
}

/** Ping all public functions in parallel. */
export async function pingAll(
  supabaseUrl: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<ServiceStatus[]> {
  return Promise.all(PUBLIC_FUNCTIONS.map((n) => pingFunction(n, supabaseUrl, fetchImpl)));
}
