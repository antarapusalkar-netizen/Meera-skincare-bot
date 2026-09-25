import { NextResponse } from "next/server";

function inspect(raw: string | undefined) {
  if (raw === undefined) return { present: false };
  const badCharPositions: { index: number; code: number }[] = [];
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 33 || code > 126) badCharPositions.push({ index: i, code });
  }
  return {
    present: true,
    length: raw.length,
    startsWith: raw.slice(0, 8),
    endsWith: raw.slice(-4),
    badCharPositions: badCharPositions.slice(0, 10),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "skinstinct-content-engine",
    time: new Date().toISOString(),
    debug: {
      OPENAI_API_KEY: inspect(process.env.OPENAI_API_KEY),
      TELEGRAM_BOT_TOKEN: inspect(process.env.TELEGRAM_BOT_TOKEN),
    },
  });
}
