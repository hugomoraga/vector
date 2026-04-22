import { Router } from 'express';
import { asyncHandler } from '../middleware/auth';
import { sendSuccess } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import { getTodayDayOfWeek, getTodayDateString } from '@vector/utils';
import type { DailyItem, Routine } from '@vector/types';

const router = Router();

router.post('/', asyncHandler(async (req, res) => {
  const usersSnapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS).get();

  const results = [];

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const today = getTodayDateString();
    const todayDOW = getTodayDayOfWeek();

    const routinesSnapshot = await db.collection(FIRESTORE_COLLECTIONS.ROUTINES)
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .get();

    for (const routineDoc of routinesSnapshot.docs) {
      const routine = routineDoc.data() as Routine;

      const matchingRule = routine.rules.find(rule => rule.days.includes(todayDOW));

      for (const step of routine.steps) {
        const existingQuery = await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
          .where('userId', '==', uid)
          .where('routineId', '==', routineDoc.id)
          .where('routineStepId', '==', step.id)
          .where('date', '==', today)
          .get();

        if (!existingQuery.empty) {
          continue;
        }

        const slot = matchingRule?.slot || 'morning';
        const stepName = matchingRule?.stepOverrides?.find(o => o.stepId === step.id)?.name || step.name;

        const now = new Date().toISOString();
        const dailyItem: Omit<DailyItem, 'id'> = {
          userId: uid,
          date: today,
          routineId: routineDoc.id,
          routineStepId: step.id,
          title: stepName,
          status: 'pending',
          slot,
          createdAt: now,
          updatedAt: now,
        };

        await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS).add(dailyItem);
        results.push({ userId: uid, routineId: routineDoc.id, stepId: step.id });
      }
    }
  }

  sendSuccess(res, { generated: results.length, date: getTodayDateString() });
}));

export default router;