import { getSupabase } from "./supabase";
import { sendTelegramMessage } from "./telegram";
import { scoreNote, suggestNewsAngle } from "./llm/openai";
import { draftPost } from "./llm/draft";

const SCORE_THRESHOLD = Number(process.env.SCORE_THRESHOLD || 6);

export async function runPipeline(input: {
  chatId: number;
  text: string;
  telegramMessageId: number;
}) {
  const { chatId, text, telegramMessageId } = input;
  const supabase = getSupabase();

  const { data: note, error: insertError } = await supabase
    .from("notes")
    .insert({
      telegram_chat_id: chatId,
      telegram_message_id: telegramMessageId,
      raw_text: text,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !note) {
    console.error("Failed to insert note", insertError);
    return;
  }

  try {
    const { score, reason } = await scoreNote(text);

    if (score < SCORE_THRESHOLD) {
      await supabase
        .from("notes")
        .update({ score, score_reason: reason, status: "rejected" })
        .eq("id", note.id);
      await sendTelegramMessage(
        chatId,
        `Rejected (score ${score}/10): ${reason}`,
        telegramMessageId
      );
      return;
    }

    const newsAngle = await suggestNewsAngle(text).catch(() => null);

    const { data: voiceRow } = await supabase
      .from("voice_skill")
      .select("content")
      .eq("name", "default")
      .maybeSingle();
    const voice =
      voiceRow?.content ||
      "Direct, specific, no corporate hedging. Short sentences.";

    const draftText = await draftPost(text, voice, newsAngle);

    await supabase
      .from("notes")
      .update({
        score,
        score_reason: reason,
        news_angle: newsAngle,
        status: "drafted",
      })
      .eq("id", note.id);

    const sent = await sendTelegramMessage(
      chatId,
      `${draftText}\n\n—\nReply APPROVE or REJECT to this message.`,
      telegramMessageId
    );

    await supabase.from("drafts").insert({
      note_id: note.id,
      draft_text: draftText,
      telegram_message_id: sent.message_id,
      status: "pending",
    });
  } catch (err) {
    console.error("Pipeline error", err);
    await sendTelegramMessage(
      chatId,
      `Something went wrong processing that note: ${(err as Error).message}`,
      telegramMessageId
    ).catch(() => {});
  }
}

export async function handleDecision(
  draftTelegramMessageId: number,
  decision: "APPROVE" | "REJECT",
  chatId: number
) {
  const status = decision === "APPROVE" ? "approved" : "rejected";
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("drafts")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("telegram_message_id", draftTelegramMessageId)
    .select()
    .single();

  if (error || !data) {
    await sendTelegramMessage(
      chatId,
      `Couldn't find a draft matching that message to ${decision.toLowerCase()}.`,
      draftTelegramMessageId
    ).catch(() => {});
    return;
  }

  await sendTelegramMessage(
    chatId,
    `Marked as ${status}.`,
    draftTelegramMessageId
  ).catch(() => {});
}
