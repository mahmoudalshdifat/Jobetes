import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
});

afterAll(async () => {
  await app.close();
});

describe('X-Request-Id', () => {
  it('generates a UUID when no header is supplied', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    const id = res.headers['x-request-id'];
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it('passes through a safe inbound id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'edge-cdn-12345' },
    });
    expect(res.headers['x-request-id']).toBe('edge-cdn-12345');
  });

  it('rejects unsafe inbound id (log-injection vector)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'evil\nlog\rinjection\x00null' },
    });
    expect(res.headers['x-request-id']).not.toContain('\n');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it('emits a different id per request', async () => {
    const a = await app.inject({ method: 'GET', url: '/health' });
    const b = await app.inject({ method: 'GET', url: '/health' });
    expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
  });
});
