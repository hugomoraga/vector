import type { DayOfWeek, RoutineRule, TimeSlot } from '@vector/types';

export const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  return DAY_MAP[dayIndex];
}

/**
 * Whether this rule applies on a given weekday.
 * Legacy rules (no `frequency`): empty `days` = every day; otherwise weekly by `days`.
 */
export function routineRuleAppliesOnDay(rule: RoutineRule, day: DayOfWeek): boolean {
  if (rule.frequency === 'daily') return true;
  if (rule.frequency === 'weekly') return rule.days.length > 0 && rule.days.includes(day);
  if (rule.days.length === 0) return true;
  return rule.days.includes(day);
}

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_MAP[date.getDay()];
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDate(new Date());
}

/** Calendar weekday for a `YYYY-MM-DD` string (UTC noon avoids DST edge cases). */
export function getDayOfWeekFromDateString(dateString: string): DayOfWeek {
  const parts = dateString.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) {
    return getTodayDayOfWeek();
  }
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return DAY_MAP[utc.getUTCDay()];
}

/** `YYYY-MM-DD` for an instant interpreted in an IANA time zone. */
export function formatDateInTimeZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return formatDate(date);
  }
}

/** Add signed calendar days to a `YYYY-MM-DD` string (UTC noon math). */
export function addCalendarDays(dateString: string, days: number): string {
  const parts = dateString.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) {
    return dateString;
  }
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Local hour (0–23) and minute in `timeZone` for `date`. */
export function getHourMinuteInTimeZone(date: Date, timeZone: string): { hour: number; minute: number } {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? '0');
    return { hour, minute };
  } catch {
    const local = new Date(date);
    return { hour: local.getHours(), minute: local.getMinutes() };
  }
}

export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getLocalTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isDateBefore(date1: string, date2: string): boolean {
  return date1 < date2;
}