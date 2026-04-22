import { randomBytes } from 'crypto';
import { Router } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/auth';
import { sendError, sendSuccess } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { ENV, FIRESTORE_COLLECTIONS } from '@vector/config';
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

router.post('/telegram-link', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;

  if (!ENV.TELEGRAM_BOT_TOKEN) {
    sendError(res, 'Telegram bot token not configured', 503);
    return;
  }
  if (!ENV.TELEGRAM_BOT_USERNAME) {
    sendError(res, 'Telegram bot username not configured', 503);
    return;
  }

  const token = randomBytes(24).toString('base64url');
  const expiresAt = Timestamp.fromMillis(Date.now() + 15 * 60 * 1000);
  const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid);
  const tokenRef = db.collection(FIRESTORE_COLLECTIONS.TELEGRAM_LINK_TOKENS).doc(token);

  let linkVersion = 1;
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const prev = (userSnap.data()?.telegramLinkVersion as number | undefined) ?? 0;
    linkVersion = prev + 1;
    tx.set(
      userRef,
      {
        telegramLinkPending: true,
        telegramLinkVersion: linkVersion,
      },
      { merge: true },
    );
    tx.set(tokenRef, {
      uid,
      expiresAt,
      used: false,
      linkVersion,
    });
  });

  const username = ENV.TELEGRAM_BOT_USERNAME.replace(/^@/, '');
  const deepLink = `https://t.me/${username}?start=${encodeURIComponent(token)}`;

  sendSuccess(res, { deepLink, expiresInSeconds: 15 * 60, linkVersion });
}));

export default router;