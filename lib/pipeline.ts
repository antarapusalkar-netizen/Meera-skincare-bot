import { getTelegramFile, sendTelegramMessage } from "./telegram";
import { scoreNote, suggestNewsAngle, transcribeAudio } from "./llm/openai";
import { draftPost } from "./llm/draft";
import { FOUNDER_VOICE } from "./voice";

const SCORE_THRESHOLD = Number(process.env.SCORE_THRESHOLD || 6);

export async function runPipeline(input: {
  chatId: number;
  text: string;
  telegramMessageId: number;
}) {
  const { chatId, text, telegramMessageId } = input;

  try {
    const { score, reason } = await scoreNote(text);

    if (score < SCORE_THRESHOLD) {
      await sendTelegramMessage(
        chatId,
        `Rejected (score ${score}/10): ${reason}`,
        telegramMessageId
      );
      return;
    }

    const newsAngle = await suggestNewsAngle(text).catch(() => null);
    const draftText = await draftPost(text, FOUNDER_VOICE, newsAngle);

    await sendTelegramMessage(
      chatId,
      `${draftText}\n\n—\nReply APPROVE or REJECT to this message.`,
      telegramMessageId
    );
  } catch (err) {
    console.error("Pipeline error", err, "cause:", (err as any)?.cause);
    await sendTelegramMessage(
      chatId,
      `Something went wrong processing that note: ${(err as Error).message}`,
      telegramMessageId
    ).catch(() => {});
  }
}

export async function handleVoiceNote(input: {
  chatId: number;
  fileId: string;
  telegramMessageId: number;
}) {
  const { chatId, fileId, telegramMessageId } = input;
  try {
    const buffer = await getTelegramFile(fileId);
    const transcript = await transcribeAudio(buffer);
    await runPipeline({ chatId, text: transcript, telegramMessageId });
  } catch (err) {
    console.error("Voice note error", err, "cause:", (err as any)?.cause);
    await sendTelegramMessage(
      chatId,
      `Couldn't transcribe that voice note: ${(err as Error).message}`,
      telegramMessageId
    ).catch(() => {});
  }
}

export async function handleDecision(
  decision: "APPROVE" | "REJECT",
  chatId: number,
  replyToMessageId: number
) {
  const label = decision === "APPROVE" ? "Approved" : "Rejected";
  await sendTelegramMessage(chatId, `${label}.`, replyToMessageId).catch(
    () => {}
  );
}
