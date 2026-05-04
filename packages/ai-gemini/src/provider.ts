import { GoogleGenerativeAI } from '@google/generative-ai';

export type AiProviderOptions = {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
};

export type GenerateRequest = {
  systemInstruction: string;
  prompt: string;
  jsonMode?: boolean;
};

export type GenerateResponse = {
  text: string;
  modelMeta: {
    provider: 'gemini' | 'mock';
    model: string;
    latencyMs: number;
    tokensIn?: number;
    tokensOut?: number;
  };
};

export interface AiProvider {
  generate(req: GenerateRequest): Promise<GenerateResponse>;
}

class GeminiProvider implements AiProvider {
  constructor(
    private readonly client: GoogleGenerativeAI,
    private readonly modelName: string,
    private readonly timeoutMs: number,
  ) {}

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const start = Date.now();
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: req.systemInstruction,
      generationConfig: req.jsonMode ? { responseMimeType: 'application/json' } : {},
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
      });
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      return {
        text,
        modelMeta: {
          provider: 'gemini',
          model: this.modelName,
          latencyMs: Date.now() - start,
          tokensIn: usage?.promptTokenCount,
          tokensOut: usage?.candidatesTokenCount,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

class MockProvider implements AiProvider {
  constructor(private readonly modelName = 'mock-deterministic-v1') {}

  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const start = Date.now();
    // Deterministic mock — used in CI and offline dev so the app
    // remains fully functional without secrets.
    let text: string;
    if (req.jsonMode) {
      text = JSON.stringify({
        urgency: 'routine',
        redFlags: [],
        topicsForConsultation: [
          'review of current symptoms with the gastroenterologist',
          'discussion of medication and allergies history',
        ],
        patientFriendlySummary:
          '[mock] Based on the information provided, a non-urgent consultation is recommended.',
        disclaimer: 'This is an automated, non-diagnostic suggestion.',
      });
    } else {
      text = `[mock response] ${req.prompt.slice(0, 200)}`;
    }
    return {
      text,
      modelMeta: {
        provider: 'mock',
        model: this.modelName,
        latencyMs: Date.now() - start,
      },
    };
  }
}

/**
 * Create the AI provider. If `apiKey` is missing or empty, returns a
 * deterministic mock provider so the app remains operable in offline /
 * CI / local-dev environments.
 */
export function createGeminiProvider(opts: AiProviderOptions = {}): AiProvider {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY ?? '';
  const model = opts.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const timeoutMs = opts.timeoutMs ?? Number(process.env.GEMINI_TIMEOUT_MS ?? 30_000);
  if (!apiKey) return new MockProvider(model);
  return new GeminiProvider(new GoogleGenerativeAI(apiKey), model, timeoutMs);
}
