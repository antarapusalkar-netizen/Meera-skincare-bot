function apiBase() {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN?.replace(/\s/g, "")}`;
}

export async function getTelegramFile(fileId: string): Promise<Buffer> {
  const infoRes = await fetch(`${apiBase()}/getFile?file_id=${fileId}`);
  const info = await infoRes.json();
  if (!info.ok) {
    throw new Error(`Telegram getFile failed: ${JSON.stringify(info)}`);
  }
  const token = process.env.TELEGRAM_BOT_TOKEN?.replace(/\s/g, "");
  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${info.result.file_path}`
  );
  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyToMessageId?: number
): Promise<{ message_id: number }> {
  const res = await fetch(`${apiBase()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
    }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram sendMessage failed: ${JSON.stringify(data)}`);
  }
  return data.result as { message_id: number };
}
