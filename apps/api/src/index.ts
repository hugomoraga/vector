import './load-env';

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import routinesRoutes from './routes/routines';
import backlogRoutes from './routes/backlog';
import dailyItemsRoutes from './routes/dailyItems';
import settingsRoutes from './routes/settings';
import generateDailyRoutes from './routes/generateDaily';
import sendRemindersRoutes from './routes/sendReminders';
import sendDailySummaryRoutes from './routes/sendDailySummary';
import statsRoutes from './routes/stats';
import telegramRoutes from './routes/telegram';

console.log('Starting Vector API...');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/backlog', backlogRoutes);
app.use('/api/daily-items', dailyItemsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/generate-daily', generateDailyRoutes);
app.use('/send-reminders', sendRemindersRoutes);
app.use('/send-daily-summary', sendDailySummaryRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`Vector API running on port ${PORT}`);
});

export default app;