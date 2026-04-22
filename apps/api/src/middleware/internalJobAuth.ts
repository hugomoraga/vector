import { timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { ENV } from '@vector/config';

/** Cloud Scheduler OIDC is sent as Authorization: Bearer <jwt>; never treat that as INTERNAL_JOB_SECRET. */
function bearerLooksLikeJwt(token: string): boolean {
  const t = token.trim();
  if (!t.startsWith('eyJ')) return false;
  return t.split('.').length >= 3;
}

function normalizeSecret(s: string): string {
  return s.trim();
}

function bodyJobSecret(req: Request): string | undefined {
  const raw = (req.body as { internalJobSecret?: unknown } | null)?.internalJobSecret;
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  return normalizeSecret(raw);
}

function getProvidedSecret(req: Request): string | undefined {
  const header = req.get('X-Vector-Job-Secret');
  if (header) return normalizeSecret(header);

  const fromBody = bodyJobSecret(req);
  if (fromBody) return fromBody;

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return undefined;

  const token = auth.slice('Bearer '.length).trim();
  if (bearerLooksLikeJwt(token)) return undefined;

  return normalizeSecret(token);
}

/**
 * Protects /generate-daily, /send-reminders, and /send-daily-summary. When INTERNAL_JOB_SECRET is set, accepts (in order):
 * X-Vector-Job-Secret, JSON body.internalJobSecret (used by Cloud Scheduler + Terraform), or
 * Authorization: Bearer <same value> when it is not an OIDC JWT. Values are trimmed (Secret Manager
 * often ends with a newline). In production, missing config rejects.
 */
export function internalJobAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expectedRaw = ENV.INTERNAL_JOB_SECRET;
  if (!expectedRaw) {
    if (ENV.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Job endpoints are disabled (INTERNAL_JOB_SECRET not set)' });
      return;
    }
    next();
    return;
  }

  const expected = normalizeSecret(expectedRaw);
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
    console.warn('[internal-job-auth] missing secret', {
      path: req.path,
      hasHeader: Boolean(req.get('X-Vector-Job-Secret')),
      hasBodyField: typeof (req.body as { internalJobSecret?: unknown })?.internalJobSecret === 'string',
      hasBearer: Boolean(req.headers.authorization?.startsWith('Bearer ')),
    });
    res.status(401).json({ error: 'Unauthorized', reason: 'missing_job_secret' });
    return;
  }

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    console.warn('[internal-job-auth] secret mismatch', { path: req.path });
    res.status(401).json({ error: 'Unauthorized', reason: 'job_secret_mismatch' });
    return;
  }

  next();
}
