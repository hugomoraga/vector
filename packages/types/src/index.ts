export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** Mon → Sun (calendar UI order). */
export const DAYS_OF_WEEK_ORDER: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/** `daily` = every day; `weekly` = only on `days`. */
export type RoutineFrequency = 'daily' | 'weekly';

export type Priority = 'low' | 'medium' | 'high';

export type BacklogStatus = 'pending' | 'in_progress' | 'done' | 'archived';

export type DailyItemStatus = 'pending' | 'done' | 'skipped' | 'rescheduled';

export type RoutineStatus = 'active' | 'inactive';

export interface RoutineStep {
  id: string;
  name: string;
  order: number;
  isOptional: boolean;
  instructions?: string;
}

export interface RoutineRule {
  /** When set, controls how `days` is interpreted. Omitted = legacy (empty days = every day). */
  frequency?: RoutineFrequency;
  days: DayOfWeek[];
  slot: TimeSlot;
  stepOverrides: { stepId: string; name: string }[];
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  category: string;
  status: RoutineStatus;
  description?: string;
  steps: RoutineStep[];
  rules: RoutineRule[];
  createdAt: string;
  updatedAt: string;
}

export interface BacklogItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: BacklogStatus;
  category?: string;
  targetDate?: string;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyItem {
  id: string;
  userId: string;
  date: string;
  routineId?: string;
  routineStepId?: string;
  backlogItemId?: string;
  title: string;
  status: DailyItemStatus;
  slot: TimeSlot;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderTime {
  slot: TimeSlot;
  hour: number;
}

export interface UserSettings {
  telegramChatId?: string;
  telegramLinkPending?: boolean;
  /** Incremented each time the user starts a Telegram link from Settings. */
  telegramLinkVersion?: number;
  /** Set to the link token’s version when a link completes in the webhook. */
  telegramLastLinkedVersion?: number;
  telegramEnabled: boolean;
  /** When false, skip the 22:30 daily Telegram digest. Default: enabled. */
  telegramEveningSummary?: boolean;
  /** IANA zone (e.g. America/Santiago). Used for digest time and batch daily generation fallback. */
  timeZone?: string;
  /** YYYY-MM-DD (user-local) when we last sent the evening digest. */
  eveningSummaryLastSentDate?: string;
  reminderTimes: ReminderTime[];
  retentionDays: number;
  theme: 'dark' | 'light' | 'system';
  /** Saved category names for routines/backlog (also extended when you save items). */
  categories?: string[];
}

export interface User {
  uid: string;
  email: string;
  createdAt: string;
}