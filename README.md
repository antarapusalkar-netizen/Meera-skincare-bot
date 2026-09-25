# Skinstinct Content Engine

Telegram note → score (reject if weak) → optional news angle → draft in the
founder's voice → sent back to Telegram → human replies APPROVE/REJECT → bot
confirms in Telegram. Nothing auto-publishes; Telegram's own chat history is
the record — there is no database.

The founder's voice guide lives in [`lib/voice.ts`](lib/voice.ts) — edit it
directly to change tone.

## Setup

See `BUILD_GUIDE.md` for the original walkthrough. Note: this build skips the
Supabase steps in it — there is no database (see note at the top of that
file).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

## Endpoints

- `GET /api/health` — liveness check
- `POST /api/webhook` — Telegram webhook (requires `x-telegram-bot-api-secret-token` header matching `TELEGRAM_WEBHOOK_SECRET`)
