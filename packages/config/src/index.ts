export const ENV = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  DEFAULT_RETENTION_DAYS: 60,
  DEFAULT_REMINDER_HOURS: [9, 14, 19],
} as const;

export const FIRESTORE_COLLECTIONS = {
  ROUTINES: 'routines',
  BACKLOG: 'backlog',
  DAILY_ITEMS: 'dailyItems',
  USERS: 'users',
} as const;

export const API_ROUTES = {
  ROUTINES: '/api/routines',
  BACKLOG: '/api/backlog',
  DAILY_ITEMS: '/api/daily-items',
  SETTINGS: '/api/settings',
  AUTH: '/api/auth',
  GENERATE_DAILY: '/generate-daily',
  SEND_REMINDERS: '/send-reminders',
} as const;