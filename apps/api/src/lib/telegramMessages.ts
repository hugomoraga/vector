import { ENV } from '@vector/config';
import { webAppTodayUrl } from './webAppUrl';

/** Placeholder in TELEGRAM_MSG_WELCOME_PLAIN for the numeric Telegram chat id. */
const CHAT_ID_PLACEHOLDER = '{{chatId}}';

export function telegramWelcomePlainMessage(chatId: number): string {
  const custom = ENV.TELEGRAM_MSG_WELCOME_PLAIN;
  if (custom) {
    return custom.split(CHAT_ID_PLACEHOLDER).join(String(chatId));
  }
  return [
    `Your Telegram chat ID is: ${chatId}`,
    '',
    'To link your Vector account automatically, open the app on the web, go to Settings → Telegram reminders, and tap Connect.',
  ].join('\n');
}

export function telegramWelcomeLinkedMessage(): string {
  const url = webAppTodayUrl();
  const tail = url ? `\n\n${url}` : '';
  const body =
    ENV.TELEGRAM_MSG_WELCOME_LINKED ||
    'Vector is linked. You will receive reminders here. You can close Telegram and return to the app.';
  return `${body}${tail}`;
}

export function telegramLinkInvalidMessage(): string {
  return (
    ENV.TELEGRAM_MSG_LINK_INVALID ||
    'This link is invalid or expired. Open Vector on the web, go to Settings, and tap Connect again.'
  );
}
