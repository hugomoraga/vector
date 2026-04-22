import { ENV } from '@vector/config';

export async function telegramSendMessage(
  chatId: string | number,
  text: string,
  options?: { parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2' },
): Promise<void> {
  const token = ENV.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('Telegram bot token not configured');
  }
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (options?.parseMode) {
    body.parse_mode = options.parseMode;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${body}`);
  }
}
