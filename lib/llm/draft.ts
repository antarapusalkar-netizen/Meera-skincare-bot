import Anthropic from "@anthropic-ai/sdk";
import { getOpenAI } from "./openai";

function buildDraftPrompt(note: string, voice: string, newsAngle: string | null) {
  return [
    `Founder's voice guide:\n${voice}`,
    `Raw note:\n${note}`,
    newsAngle
      ? `Relevant angle to consider weaving in (optional, only if it fits naturally):\n${newsAngle}`
      : "",
    "Write a single public post (LinkedIn-style) in the founder's voice above, based on the raw note. Output ONLY the post text, no preamble, no hashtags unless the voice guide calls for them.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function draftPost(
  note: string,
  voice: string,
  newsAngle: string | null
): Promise<string> {
  const prompt = buildDraftPrompt(note, voice, newsAngle);
  const model = (process.env.DRAFT_MODEL || "openai").toLowerCase();

  if (model === "claude") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('DRAFT_MODEL is "claude" but ANTHROPIC_API_KEY is not set.');
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_DRAFT_MODEL || "claude-sonnet-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text.trim() : "";
  }

  const completion = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_DRAFT_MODEL || "gpt-5.4",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content?.trim() || "";
}
