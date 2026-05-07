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
  recentIntakes: {
    id: string;
    createdAt: string;
    severity: number;
    locale: string;
    patientId: string;
    payload: Record<string, unknown>;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
  }[];
};

export async function fetchAdminSummary(token: string): Promise<AdminSummary> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anon) headers.apikey = anon;
  const res = await fetch(`${functionsBase()}/admin-summary`, { method: 'GET', headers });
  if (!res.ok) throw new Error(`admin-summary HTTP ${res.status}`);
  return (await res.json()) as AdminSummary;
}

export type Appointment = {
  id: string;
  receivedAt: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  patientName: string;
  phone: string;
  preferredLocale: string;
  reason: string;
  scheduledAt?: string;
};

export async function fetchAppointments(token: string): Promise<{ total: number; appointments: Appointment[] }> {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  if (!base) return { total: 0, appointments: [] };
  const res = await fetch(`${base}/admin/appointments`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`appointments HTTP ${res.status}`);
  return (await res.json()) as { total: number; appointments: Appointment[] };
}

export async function updateAppointment(
  token: string,
  id: string,
  update: { status?: Appointment['status']; scheduledAt?: string },
): Promise<{ id: string; status: string; scheduledAt?: string }> {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  if (!base) throw new Error('VITE_API_URL not configured');
  const res = await fetch(`${base}/admin/appointments/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error(`update appointment HTTP ${res.status}`);
  return (await res.json()) as { id: string; status: string; scheduledAt?: string };
}
