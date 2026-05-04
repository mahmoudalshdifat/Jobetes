# Operator Bot

One-button automation for Dr. Mahmoud Al-Shdaifat.

## Pipeline

```
Telegram message (text or voice)
  ↓
Allowlist check (silently ignore everyone else)
  ↓
Wake Codespace (GitHub API)
  ↓
Wait WAKEUP_WAIT_MS (default 3 min)
  ↓
If voice → STT (Gemini multimodal OR Whisper)
  ↓
Prompt-Enhancer (Gemini)
  ↓
Execute via CLI-Anything (HKUDS — `pip install cli-anything-hub`)
  ↓
Reply with output back into the same Telegram thread
```

## Quickstart

```bash
cd apps/operator-bot
cp ../../.env.example .env       # fill in TELEGRAM_BOT_TOKEN + allowlist
pnpm install
pnpm dev
```

In Telegram talk to your bot:
- `/ping` → liveness
- text message → enhanced + executed
- voice message → transcribed + enhanced + executed

## Required env

| Var | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | from @BotFather |
| `TELEGRAM_ALLOWED_USER_IDS` | comma-separated Telegram user IDs (Dr. Mahmoud only) |
| `GITHUB_PAT` | PAT with `codespace` scope (else codespace step no-ops) |
| `GITHUB_CODESPACE_NAME` | the named codespace to start |
| `GEMINI_API_KEY` | for STT and prompt-enhancer (else falls back to mock) |
| `OPENAI_API_KEY` | optional — used only if `STT_PROVIDER=openai-whisper` |
| `EXECUTE_DRY_RUN` | `true` to skip CLI-Anything binary call (echo only) |

## Security

- **Allowlist is hard.** Non-allowlisted user IDs receive no reply at all.
- Bot token is treated as patient-data-equivalent secret (see `compliance/`).
- The bot does not store conversation history beyond Telegram itself.
- Audio bytes are streamed to STT, never persisted to disk.
