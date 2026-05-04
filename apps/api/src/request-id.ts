import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

/**
 * Adds a per-request `X-Request-Id` header.
 *
 * - If the inbound request supplies one, we pass it through (so a BFF or
 *   reverse proxy can correlate). It is sanitized to a UUID-shaped or
 *   short alphanumeric value to prevent log injection.
 * - Otherwise we mint a fresh UUID v4.
 *
 * Every log line emitted via `request.log` automatically picks up the id
 * because Fastify attaches the request context as a child logger.
 */

const SAFE_ID = /^[A-Za-z0-9_-]{6,128}$/u;

declare module 'fastify' {
  interface FastifyRequest {
    requestId?: string;
  }
}

export async function attachRequestId(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request, reply) => {
    const inbound = request.headers['x-request-id'];
    const candidate =
      typeof inbound === 'string' && SAFE_ID.test(inbound) ? inbound : randomUUID();
    request.requestId = candidate;
    reply.header('x-request-id', candidate);
  });
}
