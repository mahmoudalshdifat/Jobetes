/**
 * Doctor-portal API client. All endpoints require a Supabase access token
 * and the `admin-summary` edge function checks the email is in the
 * doctor allowlist server-side.
 */

const BASE =
  (import.meta.env.VITE_SUPABASE_URL ?? '') + '/functions/v1';

export type AdminSummary = {
  intakes: number;
  appointments: number;
  recentIntakes: { id: string; createdAt: string; severity: number; locale: string }[];
};

export async function fetchAdminSummary(token: string): Promise<AdminSummary> {
  const res = await fetch(`${BASE}/admin-summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`admin-summary HTTP ${res.status}`);
  return (await res.json()) as AdminSummary;
}
