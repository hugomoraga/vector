import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { DailyItem, Routine } from '@vector/types';
import { getDayOfWeekFromDateString, routineRuleAppliesOnDay } from '@vector/utils';
import { db } from './firebase-admin';

/**
 * Creates missing daily rows for active routines that apply on `targetDate`.
 * Idempotent: skips when a row already exists for the same user/routine/step/date.
 */
export async function ensureRoutineDailyItemsForUser(uid: string, targetDate: string): Promise<number> {
  let created = 0;
  const dow = getDayOfWeekFromDateString(targetDate);

  const routinesSnapshot = await db
    .collection(FIRESTORE_COLLECTIONS.ROUTINES)
    .where('userId', '==', uid)
    .where('status', '==', 'active')
    .get();

  for (const routineDoc of routinesSnapshot.docs) {
    const routine = routineDoc.data() as Routine;
    const rules = Array.isArray(routine.rules) ? routine.rules : [];
    const matchingRule = rules.find(rule => routineRuleAppliesOnDay(rule, dow));

    if (!matchingRule) {
      continue;
    }

    const steps = Array.isArray(routine.steps) ? routine.steps : [];
    for (const step of steps) {
      const existingQuery = await db
        .collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
        .where('userId', '==', uid)
        .where('routineId', '==', routineDoc.id)
        .where('routineStepId', '==', step.id)
        .where('date', '==', targetDate)
        .get();

      if (!existingQuery.empty) {
        continue;
      }

      const slot = matchingRule?.slot || 'morning';
      const stepName = matchingRule?.stepOverrides?.find(o => o.stepId === step.id)?.name || step.name;

      const now = new Date().toISOString();
      const dailyItem: Omit<DailyItem, 'id'> = {
        userId: uid,
        date: targetDate,
        routineId: routineDoc.id,
        routineStepId: step.id,
        title: stepName,
        status: 'pending',
        slot,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS).add(dailyItem);
      created += 1;
    }
  }

  return created;
}
