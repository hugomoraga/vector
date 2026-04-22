import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { UserSettings } from '@vector/types';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;

  const userDoc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid).get();

  if (!userDoc.exists) {
    const defaultSettings: UserSettings = {
      telegramEnabled: false,
      reminderTimes: [
        { slot: 'morning', hour: 9 },
        { slot: 'afternoon', hour: 14 },
        { slot: 'evening', hour: 19 },
      ],
      retentionDays: 60,
      theme: 'system',
    };

    await userDoc.ref.set(defaultSettings);
    sendSuccess(res, defaultSettings);
    return;
  }

  sendSuccess(res, userDoc.data());
}));

router.put('/', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const updates = req.body;

  const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid);
  await userRef.update(updates);

  const updatedDoc = await userRef.get();
  sendSuccess(res, updatedDoc.data());
}));

export default router;