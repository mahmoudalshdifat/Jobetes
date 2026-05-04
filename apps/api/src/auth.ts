import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AppConfig } from './config.js';

export type AuthenticatedUser = {
  supabaseUserId: string;
  email?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Verify a Supabase access token against the project's JWKS.
 *
 * Supabase exposes JWKS at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 * In Phase 0 (no SUPABASE_URL configured), the verifier no-ops and the
 * `requireAuth` decorator answers 401 for every protected route.
 */
export function attachAuth(app: FastifyInstance, cfg: AppConfig): void {
  const supaUrl = cfg.SUPABASE_URL.trim();
  const jwks = supaUrl
    ? createRemoteJWKSet(new URL(`${supaUrl.replace(/\/+$/, '')}/auth/v1/.well-known/jwks.json`))
    : null;

  app.decorateRequest('user', undefined);

  // Optional auth: populates request.user when a valid Bearer token is present.
  app.addHook('preHandler', async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return;
    if (!jwks) return; // mock mode — never authenticate in Phase 0
    const token = auth.slice(7).trim();
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${supaUrl.replace(/\/+$/, '')}/auth/v1`,
      });
      const sub = (payload as JWTPayload).sub;
      if (typeof sub === 'string') {
        request.user = {
          supabaseUserId: sub,
          email: typeof payload.email === 'string' ? payload.email : undefined,
        };
      }
    } catch (err) {
      request.log.warn({ err }, 'invalid Bearer token — ignoring');
    }
  });
}

/** Guard helper for protected routes. */
export async function requireAuth(request: FastifyRequest): Promise<AuthenticatedUser> {
  if (!request.user) {
    const err = new Error('Authentication required');
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  return request.user;
}
