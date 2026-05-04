import type {
  DoctorProfile,
  PatientIntake,
  TriageInput,
  TriageResult,
} from '@jobetes/shared-schemas';

/**
 * Tiny, type-safe wrapper over the Jobetes API. No external HTTP dependency
 * (uses native fetch) so the bundle stays small. Bearer token is optional —
 * provide it for `/me/*` routes after Supabase sign-in.
 */
export type ApiClientOptions = {
  baseUrl?: string;
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

export class JobetesApiClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null | Promise<string | null>;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? '/api').replace(/\/+$/, '');
    this.getToken = opts.getToken;
  }

  private async headers(): Promise<HeadersInit> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await this.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: await this.headers(),
      body: body == null ? undefined : JSON.stringify(body),
      credentials: 'include',
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
    return this.request('GET', '/health');
  }

  doctorProfile(): Promise<DoctorProfile> {
    return this.request('GET', '/doctor/profile');
  }

  submitIntake(intake: PatientIntake): Promise<{ id: string; receivedAt: string }> {
    return this.request('POST', '/intake', intake);
  }

  triage(input: TriageInput): Promise<TriageResult> {
    return this.request('POST', '/ai/triage', input);
  }

  me(): Promise<{ user: { supabaseUserId: string; email?: string } }> {
    return this.request('GET', '/me');
  }

  myIntakes(): Promise<{
    total: number;
    intakes: { id: string; receivedAt: string }[];
    persistence: 'memory' | 'prisma';
  }> {
    return this.request('GET', '/me/intakes');
  }

  claimByPhone(phone: string): Promise<{ patientId: string }> {
    return this.request('POST', '/me/claim', { phone });
  }
}
