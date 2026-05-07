import type {
  DoctorProfile,
  PatientIntake,
  TriageInput,
  TriageResult,
} from '@jobetes/shared-schemas';

/**
 * Tiny, type-safe wrapper over the Jobetes API.
 *
 * Two deployment targets, identical contract:
 *  - **Fastify** (apps/api/, e.g. Fly.io) — paths like `/doctor/profile`, `/ai/triage`
 *  - **Supabase Edge Functions** — flat names: `/doctor-profile`, `/triage`
 *
 * `transport` selects the path style. Defaults to `'edge'` because that is
 * the production deploy. For local dev with a running Fastify server set
 * `transport: 'fastify'`. The dev proxy (`vite.config.ts`) already maps
 * `/api/*` to localhost:3000 if you keep the Fastify mode.
 */
export type Transport = 'edge' | 'fastify';

export type ApiClientOptions = {
  baseUrl?: string;
  transport?: Transport;
  getToken?: () => string | null | Promise<string | null>;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const PATHS: Record<Transport, Record<string, string>> = {
  edge: {
    health: '/health',
    doctorProfile: '/doctor-profile',
    intake: '/intake',
    triage: '/triage',
    me: '/me',
    myIntakes: '/me-intakes',
    myAppointments: '/me-appointments',
    claim: '/me-claim',
    export: '/me-export',
  },
  fastify: {
    health: '/health',
    doctorProfile: '/doctor/profile',
    intake: '/intake',
    triage: '/ai/triage',
    me: '/me',
    myIntakes: '/me/intakes',
    myAppointments: '/me/appointments',
    claim: '/me/claim',
    export: '/me/export',
  },
};

export class JobetesApiClient {
  private readonly baseUrl: string;
  private readonly transport: Transport;
  private readonly getToken?: () => string | null | Promise<string | null>;

  constructor(opts: ApiClientOptions = {}) {
    this.transport = opts.transport ?? 'edge';
    this.baseUrl = (opts.baseUrl ?? this.defaultBaseUrl()).replace(/\/+$/, '');
    this.getToken = opts.getToken;
  }

  private defaultBaseUrl(): string {
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    return this.transport === 'edge' ? '' : '/api';
  }

  private async headers(): Promise<HeadersInit> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await this.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    // Supabase edge functions also require the apikey header for verify_jwt=true
    // routes; harmless on verify_jwt=false routes.
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    if (env?.VITE_SUPABASE_ANON_KEY && this.transport === 'edge') {
      headers.apikey = env.VITE_SUPABASE_ANON_KEY;
      if (!headers.Authorization) headers.Authorization = `Bearer ${env.VITE_SUPABASE_ANON_KEY}`;
    }
    return headers;
  }

  private async request<T>(method: string, key: string, body?: unknown): Promise<T> {
    const path = PATHS[this.transport][key];
    if (!path) throw new Error(`unknown path key: ${key}`);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: await this.headers(),
      body: body == null ? undefined : JSON.stringify(body),
      // edge functions don't need cookies; credentials hurts CORS.
      credentials: this.transport === 'edge' ? 'omit' : 'include',
    });
    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text().catch(() => null);
      }
      throw new ApiError(res.status, errorBody, `${method} ${path} → ${res.status}`);
    }
    return (await res.json()) as T;
  }

  health(): Promise<{ status: 'ok'; service: string; timestamp: string }> {
    return this.request('GET', 'health');
  }

  doctorProfile(): Promise<DoctorProfile> {
    return this.request('GET', 'doctorProfile');
  }

  submitIntake(intake: PatientIntake): Promise<{ id: string; receivedAt: string }> {
    return this.request('POST', 'intake', intake);
  }

  triage(input: TriageInput): Promise<TriageResult> {
    return this.request('POST', 'triage', input);
  }

  me(): Promise<{ user: { supabaseUserId: string; email?: string } }> {
    return this.request('GET', 'me');
  }

  myIntakes(): Promise<{
    total: number;
    intakes: { id: string; receivedAt: string }[];
    persistence: 'memory' | 'prisma';
  }> {
    return this.request('GET', 'myIntakes');
  }

  claimByPhone(phone: string): Promise<{ patientId: string }> {
    return this.request('POST', 'claim', { phone });
  }

  myAppointments(): Promise<{
    total: number;
    appointments: {
      id: string;
      receivedAt: string;
      status: string;
      patientName: string;
      reason: string;
      preferredWindow: string;
      preferredDates: string[];
      scheduledAt?: string;
    }[];
  }> {
    return this.request('GET', 'myAppointments');
  }

  exportMyData(): Promise<Blob> {
    return this.request('GET', 'export');
  }

  updateProfile(data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>): Promise<{ updated: boolean }> {
    return this.request('PATCH', 'me', data);
  }

  deleteMyAccount(): Promise<{ deleted: boolean }> {
    return this.request('DELETE', 'me');
  }
}
