import { afterEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from './stt.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const audioBytes = new Uint8Array([1, 2, 3]);

describe('transcribeAudio', () => {
  it('returns mock string in mock mode', async () => {
    const r = await transcribeAudio(
      { STT_PROVIDER: 'mock', GEMINI_API_KEY: '', GEMINI_MODEL: 'gemini-2.0-flash', OPENAI_API_KEY: '' },
      audioBytes,
    );
    expect(r).toMatch(/mock-stt/u);
  });

  it('returns mock when no key is set even if provider is gemini', async () => {
    const r = await transcribeAudio(
      { STT_PROVIDER: 'gemini', GEMINI_API_KEY: '', GEMINI_MODEL: 'g', OPENAI_API_KEY: '' },
      audioBytes,
    );
    expect(r).toMatch(/mock-stt/u);
  });

  it('calls Gemini when key is set', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'hello world' }] } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    ) as typeof fetch;
    const r = await transcribeAudio(
      { STT_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-2.0-flash', OPENAI_API_KEY: '' },
      audioBytes,
    );
    expect(r).toBe('hello world');
  });

  it('throws on Gemini HTTP error', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('boom', { status: 500 }),
    ) as typeof fetch;
    await expect(
      transcribeAudio(
        { STT_PROVIDER: 'gemini', GEMINI_API_KEY: 'k', GEMINI_MODEL: 'g', OPENAI_API_KEY: '' },
        audioBytes,
      ),
    ).rejects.toThrow(/500/u);
  });

  it('routes to Whisper when provider=openai-whisper', async () => {
    let lastUrl = '';
    globalThis.fetch = vi.fn(async (url) => {
      lastUrl = String(url);
      return new Response(JSON.stringify({ text: 'whisper says' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    const r = await transcribeAudio(
      { STT_PROVIDER: 'openai-whisper', GEMINI_API_KEY: '', GEMINI_MODEL: 'g', OPENAI_API_KEY: 'sk' },
      audioBytes,
    );
    expect(r).toBe('whisper says');
    expect(lastUrl).toMatch(/openai\.com.*transcriptions/u);
  });

  it('throws on Whisper HTTP error', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('boom', { status: 401 }),
    ) as typeof fetch;
    await expect(
      transcribeAudio(
        {
          STT_PROVIDER: 'openai-whisper',
          GEMINI_API_KEY: '',
          GEMINI_MODEL: 'g',
          OPENAI_API_KEY: 'sk',
        },
        audioBytes,
      ),
    ).rejects.toThrow(/401/u);
  });
});
