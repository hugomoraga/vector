import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { internalJobAuthMiddleware } from '../middleware/internalJobAuth';
import { sendSuccess, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS, ENV } from '@vector/config';
import { getTodayDateString } from '@vector/utils';
import type { DailyItem, UserSettings } from '@vector/types';
import { buildReminderMessage, getReminderTemplate } from '../lib/reminderTemplate';
import { telegramSendMessage } from '../lib/telegram';

const router = Router();

router.use(internalJobAuthMiddleware);

router.post('/', asyncHandler(async (req, res) => {
  if (!ENV.TELEGRAM_BOT_TOKEN) {
    sendError(res, 'Telegram bot token not configured', 500);
    return;
  }

  const today = getTodayDateString();

  const usersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS).get();

  const results = [];

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const settings = userDoc.data() as UserSettings;

    if (!settings.telegramEnabled || !settings.telegramChatId) {
      continue;
    }

    const pendingQuery = await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
      .where('userId', '==', uid)
      .where('date', '==', today)
      .where('status', '==', 'pending')
      .get();

    if (pendingQuery.empty) {
      continue;
    }

    const pendingItems = pendingQuery.docs.map((d) => {
      const row = d.data() as DailyItem;
      return { title: row.title || 'Untitled', slot: row.slot };
    });
    const pendingCount = pendingItems.length;
    const template = getReminderTemplate();
    const { text: message, parseMode } = buildReminderMessage(template, today, pendingItems);

    try {
      await telegramSendMessage(settings.telegramChatId, message, { parseMode });

      results.push({ userId: uid, sent: true, count: pendingCount });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ userId: uid, sent: false, error: msg });
    }
  }

  sendSuccess(res, { reminders: results, date: today });
}));

export default router;