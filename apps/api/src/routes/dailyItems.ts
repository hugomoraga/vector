import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { DailyItem } from '@vector/types';
import { formatDate } from '@vector/utils';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { date } = req.query;

  const targetDate = date ? String(date) : formatDate(new Date());

  const query: FirebaseFirestore.Query = db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
    .where('userId', '==', uid)
    .where('date', '==', targetDate);

  const snapshot = await query.get();
  const items: DailyItem[] = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as DailyItem));

  items.sort((a, b) => {
    const slotOrder = { morning: 0, afternoon: 1, evening: 2 };
    return slotOrder[a.slot] - slotOrder[b.slot];
  });

  sendSuccess(res, items);
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;

  const doc = await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS).doc(id).get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Daily item not found', 404);
    return;
  }

  sendSuccess(res, { id: doc.id, ...doc.data() } as DailyItem);
}));

router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;
  const { status } = req.body;

  const docRef = db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS).doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Daily item not found', 404);
    return;
  }

  await docRef.update({
    status,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await docRef.get();
  sendSuccess(res, { id: updatedDoc.id, ...updatedDoc.data() });
}));

router.post('/promote/:backlogId', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { backlogId } = req.params;
  const { date, slot } = req.body;

  const targetDate = date || formatDate(new Date());
  const targetSlot = slot || 'morning';

  const backlogDoc = await db.collection(FIRESTORE_COLLECTIONS.BACKLOG).doc(backlogId).get();

  if (!backlogDoc.exists || backlogDoc.data()?.userId !== uid) {
    sendError(res, 'Backlog item not found', 404);
    return;
  }

  const backlogData = backlogDoc.data();
  if (!backlogData) {
    sendError(res, 'Backlog item not found', 404);
    return;
  }

  const existingQuery = await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
    .where('userId', '==', uid)
    .where('backlogItemId', '==', backlogId)
    .where('date', '==', targetDate)
    .get();

  if (!existingQuery.empty) {
    sendError(res, 'Item already promoted to today', 409);
    return;
  }

  const now = new Date().toISOString();
  const dailyItem: Omit<DailyItem, 'id'> = {
    userId: uid,
    date: targetDate,
    backlogItemId: backlogId,
    title: backlogData.title,
    status: 'pending',
    slot: targetSlot,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS).add(dailyItem);

  await backlogDoc.ref.update({
    status: 'in_progress',
    updatedAt: now,
  });

  sendCreated(res, { id: docRef.id, ...dailyItem });
}));

export default router;