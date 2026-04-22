import { ENV } from '@vector/config';

export async function telegramSendMessage(chatId: string | number, text: string): Promise<void> {
  const token = ENV.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('Telegram bot token not configured');
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${body}`);
  }
}
