/**
 * Telegram Bot API webhook. After deploy, register once (use `terraform output api_url` for the API host):
 *
 * curl -sS -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
 *   -H "Content-Type: application/json" \
 *   -d '{"url":"<api_url>/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
 *
 * TELEGRAM_WEBHOOK_SECRET must match secret_token. If unset locally, the webhook accepts updates without the header (dev only).
 */
import { Router, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { ENV, FIRESTORE_COLLECTIONS } from '@vector/config';
import { db } from '../lib/firebase-admin';
import { telegramSendMessage } from '../lib/telegram';
import {
  telegramLinkInvalidMessage,
  telegramWelcomeLinkedMessage,
  telegramWelcomePlainMessage,
} from '../lib/telegramMessages';

const router = Router();

function verifyWebhookSecret(req: Request): boolean {
  const secret = ENV.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  const headerVal = req.get('X-Telegram-Bot-Api-Secret-Token');
  if (!headerVal) {
    return false;
  }
  const a = Buffer.from(headerVal, 'utf8');
  const b = Buffer.from(secret, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

interface TelegramMessage {
  message_id: number;
  chat?: { id: number; type?: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/** Payload after /start, or null for plain /start, or sentinel when not a start command. */
function parseStartPayload(text: string | undefined): string | null | false {
  if (!text) return false;
  let s = text.trim();
  if (!s.startsWith('/start')) return false;
  s = s.slice('/start'.length).trim();
  if (s.startsWith('@')) {
    const sp = s.indexOf(' ');
    s = sp === -1 ? '' : s.slice(sp + 1).trim();
  }
  return s || null;
}

async function handleStartWithToken(chatId: number, linkToken: string): Promise<void> {
  const tokenRef = db.collection(FIRESTORE_COLLECTIONS.TELEGRAM_LINK_TOKENS).doc(linkToken);
  const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(tokenRef);
      if (!snap.exists) {
        throw new Error('not_found');
      }
      const data = snap.data() as {
        uid: string;
        expiresAt: Timestamp;
        used?: boolean;
        linkVersion?: number;
      };
      if (data.used) {
        throw new Error('used');
      }
      if (data.expiresAt.toMillis() < Date.now()) {
        throw new Error('expired');
      }
      tx.update(tokenRef, { used: true });
      tx.set(
        userRef.doc(data.uid),
        {
          telegramChatId: String(chatId),
          telegramEnabled: true,
          telegramLinkPending: false,
          telegramLastLinkedVersion: data.linkVersion ?? 0,
        },
        { merge: true },
      );
    });
    await telegramSendMessage(chatId, telegramWelcomeLinkedMessage());
  } catch (e: unknown) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'not_found' || code === 'used' || code === 'expired') {
      await telegramSendMessage(chatId, telegramLinkInvalidMessage());
      return;
    }
    throw e;
  }
}

async function handleStartPlain(chatId: number): Promise<void> {
  await telegramSendMessage(chatId, telegramWelcomePlainMessage(chatId));
}

async function processUpdate(body: TelegramUpdate): Promise<void> {
  const msg = body.message;
  if (!msg?.chat?.id) return;

  const chatId = msg.chat.id;
  const payload = parseStartPayload(msg.text);
  if (payload === false) return;
  if (payload === null) {
    await handleStartPlain(chatId);
    return;
  }
  await handleStartWithToken(chatId, payload);
}

router.post('/webhook', (req: Request, res: Response) => {
  if (!ENV.TELEGRAM_BOT_TOKEN) {
    res.status(503).json({ error: 'Telegram not configured' });
    return;
  }
  if (!verifyWebhookSecret(req)) {
    res.sendStatus(403);
    return;
  }

  res.sendStatus(200);

  const body = req.body as TelegramUpdate;
  void processUpdate(body).catch((err) => {
    console.error('Telegram webhook processing error:', err);
  });
});

export default router;
