import { Bot, type Context } from 'grammy';
import pino from 'pino';
import { loadBotConfig } from './config.js';
import { runPipeline } from './pipeline.js';

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

async function main(): Promise<void> {
  const cfg = loadBotConfig();
  const allowed = new Set(cfg.TELEGRAM_ALLOWED_USER_IDS);
  const bot = new Bot(cfg.TELEGRAM_BOT_TOKEN);

  bot.use(async (ctx, next) => {
    const uid = ctx.from?.id;
    if (!uid || !allowed.has(uid)) {
      log.warn({ uid }, 'unauthorized message — silently ignored');
      return; // never reply to non-allowlisted users
    }
    await next();
  });

  bot.command('start', async (ctx) => {
    await ctx.reply(
      'Bereit. Schicken Sie mir Text oder eine Sprachnachricht — ich erweitere den Prompt und führe ihn aus.',
    );
  });

  bot.command('ping', async (ctx) => {
    await ctx.reply('pong');
  });

  bot.on('message:voice', (ctx) => handleVoice(ctx, cfg, bot));
  bot.on('message:text', (ctx) => handleText(ctx, cfg));

  bot.catch((err) => {
    log.error({ err }, 'bot error');
  });

  log.info('Operator bot starting…');
  await bot.start({ onStart: (info) => log.info({ info }, 'bot started') });
}

async function handleText(ctx: Context, cfg: ReturnType<typeof loadBotConfig>): Promise<void> {
  const text = ctx.message?.text?.trim();
  if (!text) return;
  await ctx.reply('🟡 Empfangen. Wache Codespace auf — bitte ~3 Minuten Geduld.');
  try {
    const result = await runPipeline(cfg, log, { kind: 'text', text });
    await ctx.reply(formatResult(result), { parse_mode: 'Markdown' });
  } catch (err) {
    log.error({ err }, 'pipeline failed');
    await ctx.reply('🔴 Pipeline-Fehler. Logs prüfen.');
  }
}

async function handleVoice(
  ctx: Context,
  cfg: ReturnType<typeof loadBotConfig>,
  bot: Bot,
): Promise<void> {
  const voice = ctx.message?.voice;
  if (!voice) return;
  await ctx.reply('🎙 Sprachnachricht empfangen — transkribiere und führe Pipeline aus.');
  try {
    const file = await bot.api.getFile(voice.file_id);
    if (!file.file_path) throw new Error('Telegram returned no file_path');
    const url = `https://api.telegram.org/file/bot${cfg.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Telegram file fetch failed HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const result = await runPipeline(cfg, log, {
      kind: 'voice',
      bytes,
      mimeType: voice.mime_type,
    });
    await ctx.reply(formatResult(result), { parse_mode: 'Markdown' });
  } catch (err) {
    log.error({ err }, 'voice pipeline failed');
    await ctx.reply('🔴 STT- oder Pipeline-Fehler.');
  }
}

function formatResult(r: Awaited<ReturnType<typeof runPipeline>>): string {
  const wakeLine = r.codespaceAwoken
    ? '✅ Codespace geweckt'
    : `⚠️ Codespace nicht geweckt (${r.codespaceReason ?? 'unknown'})`;
  return [
    wakeLine,
    '',
    '*Empfangen:*',
    '`' + truncate(r.rawText, 600) + '`',
    '',
    '*Erweiterter Prompt:*',
    '`' + truncate(r.enhancedPrompt, 600) + '`',
    '',
    '*CLI-Output (' + r.cliExitCode + ', ' + (r.cliRanBinary ? 'real' : 'fallback') + '):*',
    '`' + truncate(r.cliStdout, 600) + '`',
    '',
    `_Pipeline ${r.durationMs} ms_`,
  ].join('\n');
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + '…';
}

void main();
