import OpenAI, { toFile } from "openai";

let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY?.replace(/\s/g, ""),
    });
  }
  return client;
}

export async function scoreNote(
  text: string
): Promise<{ score: number; reason: string }> {
  const completion = await getOpenAI().chat.completions.create({
    model: process.env.SCORE_MODEL || "gpt-5.4-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You score raw founder notes for whether they are worth turning into public content (a LinkedIn post, article, etc). Score 1-10: 10 = a genuinely sharp, specific, differentiated insight; 1 = generic filler with no hook. Respond ONLY with JSON: {"score": <number 1-10>, "reason": "<one sentence>"}.',
      },
      { role: "user", content: text },
    ],
  });
  const parsed = JSON.parse(completion.choices[0].message.content || "{}");
  return { score: Number(parsed.score) || 0, reason: parsed.reason || "" };
}

/**
 * Best-effort angle suggestion from the model's general knowledge — this is
 * NOT a live news/web search. Wire in a real search API here if live
 * grounding is needed later.
 */
export async function suggestNewsAngle(text: string): Promise<string | null> {
  const completion = await getOpenAI().chat.completions.create({
    model: process.env.SCORE_MODEL || "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content:
          'Given a founder note, suggest a brief, relevant current-events or industry-trend angle that could sharpen a public post about it, if one genuinely fits (based on your general knowledge, not live search). If nothing fits well, respond with exactly "NONE". Otherwise respond with one or two sentences, no preamble.',
      },
      { role: "user", content: text },
    ],
  });
  const out = completion.choices[0].message.content?.trim() || "NONE";
  return out === "NONE" ? null : out;
}

export async function transcribeAudio(buffer: Buffer): Promise<string> {
  // Filename extension matters to the API regardless of the source's own
  // extension (Telegram serves voice notes as .oga) -- .ogg is the accepted
  // name for this container format.
  const file = await toFile(buffer, "voice.ogg");
  const transcription = await getOpenAI().audio.transcriptions.create({
    file,
    model: process.env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
  });
  return transcription.text;
}
