import { db } from './firebase-admin';
import { FIRESTORE_COLLECTIONS } from '@vector/config';

const MAX_CATEGORIES = 200;
const MAX_NAME_LEN = 80;

/** Trims and caps length; returns null if empty after trim. */
export function sanitizeCategoryName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim().slice(0, MAX_NAME_LEN);
  return t.length ? t : null;
}

/** Appends a category to the user's list if new (case-insensitive). */
export async function recordUserCategory(uid: string, raw: unknown): Promise<void> {
  const name = sanitizeCategoryName(raw);
  if (!name) return;

  const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid);
  await db.runTransaction(async tx => {
    const snap = await tx.get(userRef);
    const existing = (snap.data()?.categories as unknown[] | undefined) ?? [];
    const list = existing.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    const lower = new Set(list.map(c => c.toLowerCase()));
    if (lower.has(name.toLowerCase())) return;
    const next = [...list, name];
    if (next.length > MAX_CATEGORIES) {
      next.splice(0, next.length - MAX_CATEGORIES);
    }
    tx.set(userRef, { categories: next }, { merge: true });
  });
}
