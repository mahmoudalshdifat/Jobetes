import type { BotConfig } from './config.js';

/**
 * Transcribe audio bytes (OGG/Opus from Telegram) into text.
 *
 * Provider matrix:
 *   - "mock"          → deterministic stub (test/dev)
 *   - "gemini"        → Gemini multimodal (audio inline-data)
 *   - "openai-whisper"→ OpenAI /v1/audio/transcriptions
 */
export async function transcribeAudio(
  cfg: Pick<BotConfig, 'STT_PROVIDER' | 'GEMINI_API_KEY' | 'GEMINI_MODEL' | 'OPENAI_API_KEY'>,
  audioBytes: Uint8Array,
  mimeType = 'audio/ogg',
): Promise<string> {
  if (cfg.STT_PROVIDER === 'mock' || (!cfg.GEMINI_API_KEY && !cfg.OPENAI_API_KEY)) {
    return '[mock-stt] (audio length: ' + audioBytes.byteLength + ' bytes)';
  }
  if (cfg.STT_PROVIDER === 'openai-whisper' && cfg.OPENAI_API_KEY) {
    return transcribeWithWhisper(audioBytes, cfg.OPENAI_API_KEY, mimeType);
  }
  return transcribeWithGemini(audioBytes, mimeType, cfg.GEMINI_API_KEY, cfg.GEMINI_MODEL);
}

async function transcribeWithGemini(
  audioBytes: Uint8Array,
  mimeType: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const base64 = Buffer.from(audioBytes).toString('base64');
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Transcribe this audio verbatim. Output only the transcription, no commentary.' },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini STT HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

async function transcribeWithWhisper(
  audioBytes: Uint8Array,
  apiKey: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes('ogg') ? 'ogg' : 'mp3';
  const file = new Blob([audioBytes], { type: mimeType });
  const form = new FormData();
  form.append('file', file, `voice.${ext}`);
  form.append('model', 'whisper-1');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Whisper HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? '';
}
