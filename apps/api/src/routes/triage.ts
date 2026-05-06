import type { FastifyInstance } from 'fastify';
import { TriageInputSchema } from '@jobetes/shared-schemas';
import { createGeminiProvider, runTriage } from '@jobetes/ai-gemini';
import type { AppConfig } from '../config.js';

export async function registerTriageRoutes(app: FastifyInstance, cfg: AppConfig): Promise<void> {
  const provider = createGeminiProvider({
    apiKey: cfg.GEMINI_API_KEY,
    model: cfg.GEMINI_MODEL,
    timeoutMs: cfg.GEMINI_TIMEOUT_MS,
  });

  app.post(
    '/ai/triage',
    {
      // Stricter rate limit for AI endpoint — each call costs tokens.
      // Global limit is 120/min; here we cap at 10/min per IP.
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = TriageInputSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'invalid_triage_input', issues: parsed.error.issues });
      }
      try {
        const result = await runTriage(provider, parsed.data);
        return reply.send(result);
      } catch (err) {
        request.log.error({ err }, 'triage failed');
        return reply.status(502).send({ error: 'triage_unavailable' });
      }
    },
  );
}
