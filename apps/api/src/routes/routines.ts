import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { parseRoutineRules } from '../lib/routineRules';
import { recordUserCategory } from '../lib/userCategories';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { Routine } from '@vector/types';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { status, category } = req.query;

  let query: FirebaseFirestore.Query = db.collection(FIRESTORE_COLLECTIONS.ROUTINES).where('userId', '==', uid);

  if (status) {
    query = query.where('status', '==', status);
  }
  if (category) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.get();
  const routines: Routine[] = [];
  snapshot.forEach(doc => routines.push({ ...doc.data(), id: doc.id } as Routine));

  sendSuccess(res, routines);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;

  const doc = await db.collection(FIRESTORE_COLLECTIONS.ROUTINES).doc(id).get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Routine not found', 404);
    return;
  }

  sendSuccess(res, { ...doc.data(), id: doc.id } as Routine);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { name, category, description, steps, rules } = req.body;

  if (!name || !category) {
    sendError(res, 'Name and category are required');
    return;
  }

  const { rules: parsedRules, error: rulesError } = parseRoutineRules(rules);
  if (rulesError) {
    sendError(res, rulesError);
    return;
  }

  const now = new Date().toISOString();
  const routine: Omit<Routine, 'id'> = {
    userId: uid,
    name,
    category,
    status: 'active',
    description,
    steps: steps || [],
    rules: parsedRules,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(FIRESTORE_COLLECTIONS.ROUTINES).add(routine);
  await recordUserCategory(uid, category);

  sendCreated(res, { id: docRef.id, ...routine });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;

  const docRef = db.collection(FIRESTORE_COLLECTIONS.ROUTINES).doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Routine not found', 404);
    return;
  }

  let payload = { ...updates };
  if (updates.rules !== undefined) {
    const { rules: parsedRules, error: rulesError } = parseRoutineRules(updates.rules);
    if (rulesError) {
      sendError(res, rulesError);
      return;
    }
    payload = { ...payload, rules: parsedRules };
  }

  await docRef.update({
    ...payload,
    updatedAt: new Date().toISOString(),
  });

  if (updates?.category != null) {
    await recordUserCategory(uid, updates.category);
  }

  const updatedDoc = await docRef.get();
  sendSuccess(res, { ...updatedDoc.data(), id: updatedDoc.id });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const { id } = req.params;

  const docRef = db.collection(FIRESTORE_COLLECTIONS.ROUTINES).doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== uid) {
    sendError(res, 'Routine not found', 404);
    return;
  }

  await docRef.delete();
  sendSuccess(res, { message: 'Routine deleted' });
}));

export default router;