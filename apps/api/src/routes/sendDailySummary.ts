import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { internalJobAuthMiddleware } from '../middleware/internalJobAuth';
import { sendSuccess, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS, ENV } from '@vector/config';
import { formatDateInTimeZone, getHourMinuteInTimeZone } from '@vector/utils';
import type { DailyItem, UserSettings } from '@vector/types';
import { escapeHtml } from '../lib/reminderTemplate';
import { telegramSendMessage } from '../lib/telegram';

const router = Router();

router.use(internalJobAuthMiddleware);

const DEFAULT_TZ = 'America/Santiago';

function slotLabel(slot: string): string {
  if (slot === 'morning') return 'Mañana';
  if (slot === 'afternoon') return 'Tarde';
  if (slot === 'evening') return 'Noche';
  return slot;
}

function sortDailyItems(items: DailyItem[]): DailyItem[] {
  const rank = (s: string) => (s === 'morning' ? 0 : s === 'afternoon' ? 1 : 2);
  return [...items].sort((a, b) => {
    const dr = rank(a.slot) - rank(b.slot);
    if (dr !== 0) return dr;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

function buildEveningSummaryHtml(date: string, done: DailyItem[], pending: DailyItem[]): string {
  const d = escapeHtml(date);
  let text = `<b>Resumen del día</b> (${d})\n\n`;

  text += `<b>Hecho (${done.length})</b>\n`;
  if (done.length === 0) {
    text += '<i>Nada marcado como hecho aún.</i>\n';
  } else {
    for (const item of sortDailyItems(done)) {
      text += `✓ ${escapeHtml(item.title)} <i>(${escapeHtml(slotLabel(item.slot))})</i>\n`;
    }
  }

  text += `\n<b>Pendiente (${pending.length})</b>\n`;
  if (pending.length === 0) {
    text += '<i>¡Nada pendiente!</i>\n';
  } else {
    for (const item of sortDailyItems(pending)) {
      text += `○ ${escapeHtml(item.title)} <i>(${escapeHtml(slotLabel(item.slot))})</i>\n`;
    }
  }

  return text;
}

router.post('/', asyncHandler(async (_req, res) => {
  if (!ENV.TELEGRAM_BOT_TOKEN) {
    sendError(res, 'Telegram bot token not configured', 500);
    return;
  }

  const usersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS).get();
  const results: { userId: string; sent?: boolean; skipped?: string; error?: string }[] = [];
  const now = new Date();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const settings = userDoc.data() as UserSettings;

    if (!settings.telegramEnabled || !settings.telegramChatId) {
      results.push({ userId: uid, skipped: 'telegram_disabled' });
      continue;
    }
    if (settings.telegramEveningSummary === false) {
      results.push({ userId: uid, skipped: 'evening_summary_disabled' });
      continue;
    }

    const tz =
      typeof settings.timeZone === 'string' && settings.timeZone.trim()
        ? settings.timeZone.trim()
        : DEFAULT_TZ;

    let todayStr: string;
    try {
      todayStr = formatDateInTimeZone(now, tz);
    } catch {
      results.push({ userId: uid, skipped: 'bad_time_zone' });
      continue;
    }

    const { hour, minute } = getHourMinuteInTimeZone(now, tz);
    const inEveningWindow = hour === 22 && minute >= 30 && minute < 45;
    if (!inEveningWindow) {
      results.push({ userId: uid, skipped: 'outside_send_window' });
      continue;
    }

    if (settings.eveningSummaryLastSentDate === todayStr) {
      results.push({ userId: uid, skipped: 'already_sent_today' });
      continue;
    }

    const snap = await db
      .collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
      .where('userId', '==', uid)
      .where('date', '==', todayStr)
      .get();

    const items: DailyItem[] = [];
    snap.forEach(d => items.push({ ...d.data(), id: d.id } as DailyItem));

    if (items.length === 0) {
      results.push({ userId: uid, skipped: 'no_items_today' });
      continue;
    }

    const done = items.filter(i => i.status === 'done');
    const pending = items.filter(i => i.status === 'pending');
    const message = buildEveningSummaryHtml(todayStr, done, pending);

    try {
      await telegramSendMessage(settings.telegramChatId, message, { parseMode: 'HTML' });
      await userDoc.ref.update({
        eveningSummaryLastSentDate: todayStr,
      });
      results.push({ userId: uid, sent: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ userId: uid, error: msg });
    }
  }

  sendSuccess(res, { summaries: results });
}));

export default router;
