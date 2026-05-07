/**
 * Doctor-portal API client. All endpoints require a Supabase access token
 * and the `admin-summary` edge function checks the email is in the
 * doctor allowlist server-side.
 *
 * The base URL is read fresh on every call (not module-cached) so tests
 * can swap VITE_SUPABASE_URL between runs.
 */

function functionsBase(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? '') + '/functions/v1';
}

export type AdminSummary = {
  intakes: number;
  appointments: number;
  recentIntakes: { id: string; createdAt: string; severity: number; locale: string }[];
};

export async function fetchAdminSummary(token: string): Promise<AdminSummary> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;
  const res = await fetch(`${functionsBase()}/admin-summary`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`admin-summary HTTP ${res.status}`);
  return (await res.json()) as AdminSummary;
}
