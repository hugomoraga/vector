import { Router, Request, Response } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../middleware/response';
import { db, getAuth } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { User } from '@vector/types';

const router = Router();

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(res, 'Email and password are required');
    return;
  }

  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
    });

    const now = new Date().toISOString();
    await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userRecord.uid).set({
      email,
      createdAt: now,
    });

    const token = await getAuth().createCustomToken(userRecord.uid);

    sendCreated(res, { uid: userRecord.uid, email, token });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      sendError(res, 'Email already registered', 409);
      return;
    }
    throw error;
  }
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    sendError(res, 'ID token is required');
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    sendSuccess(res, { uid: decoded.uid, email: decoded.email });
  } catch {
    sendError(res, 'Invalid ID token', 401);
  }
}));

export default router;