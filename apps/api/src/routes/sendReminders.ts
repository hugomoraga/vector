import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS, ENV } from '@vector/config';
import { getTodayDateString } from '@vector/utils';
import type { DailyItem, UserSettings } from '@vector/types';

const router = Router();

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

    const pendingCount = pendingQuery.size;
    const message = `You have ${pendingCount} pending task${pendingCount > 1 ? 's' : ''} for today. Don't forget!`;

    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
        }),
      });

      if (!telegramResponse.ok) {
        throw new Error(`Telegram API error: ${telegramResponse.status}`);
      }

      results.push({ userId: uid, sent: true, count: pendingCount });
    } catch (error: any) {
      results.push({ userId: uid, sent: false, error: error.message });
    }
  }

  sendSuccess(res, { reminders: results, date: today });
}));

export default router;