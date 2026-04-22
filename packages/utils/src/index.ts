import type { DayOfWeek, TimeSlot } from '@vector/types';

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