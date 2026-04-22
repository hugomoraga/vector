import { timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { ENV } from '@vector/config';

/** Cloud Scheduler OIDC is sent as Authorization: Bearer <jwt>; never treat that as INTERNAL_JOB_SECRET. */
function bearerLooksLikeJwt(token: string): boolean {
  const t = token.trim();
  if (!t.startsWith('eyJ')) return false;
  return t.split('.').length >= 3;
}

function getProvidedSecret(req: Request): string | undefined {
  const header = req.get('X-Vector-Job-Secret');
  if (header) return header.trim();

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return undefined;

  const token = auth.slice('Bearer '.length).trim();
  if (bearerLooksLikeJwt(token)) return undefined;

  return token;
}

/**
 * Protects /generate-daily and /send-reminders. When INTERNAL_JOB_SECRET is set, requires
 * X-Vector-Job-Secret (preferred for Scheduler + OIDC) or Authorization: Bearer <same value> for manual calls.
 * In production, missing config rejects.
 */
export function internalJobAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expected = ENV.INTERNAL_JOB_SECRET;
  if (!expected) {
    if (ENV.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Job endpoints are disabled (INTERNAL_JOB_SECRET not set)' });
      return;
    }
    next();
    return;
  }

  const provided = getProvidedSecret(req);
  if (!provided) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
