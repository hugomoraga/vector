export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

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
  telegramEnabled: boolean;
  reminderTimes: ReminderTime[];
  retentionDays: number;
  theme: 'dark' | 'light' | 'system';
}

export interface User {
  uid: string;
  email: string;
  createdAt: string;
}