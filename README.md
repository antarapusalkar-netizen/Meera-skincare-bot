# Skinstinct Content Engine

Telegram note → score (reject if weak) → optional news angle → draft in the
founder's voice → sent back to Telegram → human replies APPROVE/REJECT →
Supabase record updated. Nothing auto-publishes; approval only flips a
database row.

## Setup

See `BUILD_GUIDE.md` for the full walkthrough (Telegram bot, API keys,
Supabase, Vercel deploy, webhook wiring).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

## Endpoints

- `GET /api/health` — liveness check
- `POST /api/webhook` — Telegram webhook (requires `x-telegram-bot-api-secret-token` header matching `TELEGRAM_WEBHOOK_SECRET`)
