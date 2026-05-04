import { z } from 'zod';

const ConfigSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN required'),
  TELEGRAM_ALLOWED_USER_IDS: z
    .string()
    .default('')
    .transform((s) =>
      s
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .map((x) => Number(x)),
    )
    .pipe(z.array(z.number().int().positive()).min(1, 'must allowlist at least one user ID')),

  GITHUB_PAT: z.string().optional().default(''),
  GITHUB_REPO_OWNER: z.string().default('mahmoudalshdifat'),
  GITHUB_REPO_NAME: z.string().default('Jobetes'),
  GITHUB_CODESPACE_NAME: z.string().optional().default(''),

  WAKEUP_WAIT_MS: z.coerce.number().int().nonnegative().default(180_000),

  STT_PROVIDER: z.enum(['gemini', 'openai-whisper', 'mock']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  OPENAI_API_KEY: z.string().optional().default(''),

  CLI_ANYTHING_BIN: z.string().default('cli-anything'),
  EXECUTE_DRY_RUN: z.coerce.boolean().default(false),
});

export type BotConfig = z.infer<typeof ConfigSchema>;

export function loadBotConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  return ConfigSchema.parse(env);
}
