import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { runPipeline, handleDecision } from "@/lib/pipeline";

// Scoring + optional news angle + drafting can take 60-100s end to end.
// Requires a Vercel plan whose function duration limit covers this
// (Hobby caps at 60s; use Pro/Fluid Compute if the pipeline runs long).
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json();
  // Channel posts arrive as update.channel_post, not update.message.
  const message = update?.channel_post || update?.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId: number = message.chat.id;
  const text: string = message.text;

  // Telegram channel posts here don't carry reply_to_message even when sent
  // via the Reply UI, so decisions are matched on literal text instead of
  // reply-threading.
  if (/^\s*(APPROVE|REJECT)\s*$/i.test(text)) {
    const decision = text.trim().toUpperCase() as "APPROVE" | "REJECT";
    waitUntil(handleDecision(decision, chatId, message.message_id));
    return NextResponse.json({ ok: true });
  }

  waitUntil(
    runPipeline({ chatId, text, telegramMessageId: message.message_id })
  );
  return NextResponse.json({ ok: true });
}
