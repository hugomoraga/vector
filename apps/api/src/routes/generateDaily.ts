import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { internalJobAuthMiddleware } from '../middleware/internalJobAuth';
import { sendSuccess } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import { formatDateInTimeZone, getTodayDateString } from '@vector/utils';
import type { UserSettings } from '@vector/types';
import { ensureRoutineDailyItemsForUser } from '../lib/ensureRoutineDailyItems';

const DEFAULT_BATCH_TIMEZONE = 'America/Santiago';

const router = Router();

router.use(internalJobAuthMiddleware);

router.post('/', asyncHandler(async (req, res) => {
  const usersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS).get();

  let generated = 0;

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const raw = userDoc.data() as UserSettings | undefined;
    const tz =
      typeof raw?.timeZone === 'string' && raw.timeZone.trim()
        ? raw.timeZone.trim()
        : DEFAULT_BATCH_TIMEZONE;
    const today = formatDateInTimeZone(new Date(), tz);
    const n = await ensureRoutineDailyItemsForUser(uid, today);
    generated += n;
  }

  const payload = { generated, date: getTodayDateString() };
  console.info('[generate-daily]', {
    ...payload,
    usersScanned: usersSnapshot.size,
  });
  sendSuccess(res, payload);
}));

export default router;