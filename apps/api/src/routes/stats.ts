import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth';
import { sendError, sendSuccess } from '../middleware/response';
import { db } from '../lib/firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';
import type { DailyItem } from '@vector/types';
import { addCalendarDays, formatDate } from '@vector/utils';

const router = Router();

interface DailyCompletionRow {
  date: string;
  total: number;
  done: number;
  pending: number;
  skipped: number;
  rescheduled: number;
}

function emptyRow(date: string): DailyCompletionRow {
  return { date, total: 0, done: 0, pending: 0, skipped: 0, rescheduled: 0 };
}

router.get('/daily-completion', authMiddleware, asyncHandler(async (req, res) => {
  const { uid } = (req as any).user;
  const endRaw = req.query.endDate ? String(req.query.endDate) : formatDate(new Date());
  const daysParam = req.query.days ? Number(req.query.days) : 14;
  const days = Number.isFinite(daysParam) ? Math.min(90, Math.max(1, Math.floor(daysParam))) : 14;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(endRaw)) {
    sendError(res, 'Invalid endDate (expected YYYY-MM-DD)');
    return;
  }

  const dateKeys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    dateKeys.push(addCalendarDays(endRaw, -i));
  }

  const snapshots = await Promise.all(
    dateKeys.map(date =>
      db
        .collection(FIRESTORE_COLLECTIONS.DAILY_ITEMS)
        .where('userId', '==', uid)
        .where('date', '==', date)
        .get(),
    ),
  );

  const rows: DailyCompletionRow[] = dateKeys.map((date, idx) => {
    const row = emptyRow(date);
    const snap = snapshots[idx];
    snap.forEach(doc => {
      const item = doc.data() as DailyItem;
      const st = item.status;
      row.total += 1;
      if (st === 'done') row.done += 1;
      else if (st === 'pending') row.pending += 1;
      else if (st === 'skipped') row.skipped += 1;
      else if (st === 'rescheduled') row.rescheduled += 1;
    });
    return row;
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.done += r.done;
      return acc;
    },
    { total: 0, done: 0 },
  );

  sendSuccess(res, {
    endDate: endRaw,
    days,
    rows,
    periodDone: totals.done,
    periodTotal: totals.total,
    periodRate: totals.total > 0 ? Math.round((totals.done / totals.total) * 1000) / 10 : null,
  });
}));

export default router;
