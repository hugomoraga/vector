import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { BacklogItem } from '@vector/types';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { status, priority, category } = req.query;

  let query: FirebaseFirestore.Query = db.collection(FIRESTORE_COLLECTIONS.BACKLOG).where('userId', '==', uid);

  if (status) {
    query = query.where('status', '==', status);
  }
  if (priority) {
    query = query.where('priority', '==', priority);
  }
  if (category) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.get();
  const items: BacklogItem[] = [];
  snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as BacklogItem));

  sendSuccess(res, items);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;

  const doc = await db.collection(FIRESTORE_COLLECTIONS.BACKLOG).doc(id).get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Backlog item not found', 404);
    return;
  }

  sendSuccess(res, { id: doc.id, ...doc.data() } as BacklogItem);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { title, description, priority, category, targetDate, energyLevel, estimatedMinutes } = req.body;

  if (!title) {
    sendError(res, 'Title is required');
    return;
  }

  const now = new Date().toISOString();
  const item: Omit<BacklogItem, 'id'> = {
    userId: uid,
    title,
    description,
    priority: priority || 'medium',
    status: 'pending',
    category,
    targetDate,
    energyLevel,
    estimatedMinutes,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(FIRESTORE_COLLECTIONS.BACKLOG).add(item);

  sendCreated(res, { id: docRef.id, ...item });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;
  const updates = req.body;

  const docRef = db.collection(FIRESTORE_COLLECTIONS.BACKLOG).doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Backlog item not found', 404);
    return;
  }

  await docRef.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const updatedDoc = await docRef.get();
  sendSuccess(res, { id: updatedDoc.id, ...updatedDoc.data() });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;

  const docRef = db.collection(FIRESTORE_COLLECTIONS.BACKLOG).doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Backlog item not found', 404);
    return;
  }

  await docRef.delete();
  sendSuccess(res, { message: 'Backlog item deleted' });
}));

export default router;