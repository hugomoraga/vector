import { ENV } from '@vector/config';

/** Web app origin from CORS_ORIGIN. Empty when unset or wildcard (no safe link target). */
export function webAppOrigin(): string {
  const o = ENV.CORS_ORIGIN.trim();
  if (!o || o === '*') return '';
  return o.replace(/\/$/, '');
}

/** Deep link to today's pending tasks in the web app. */
export function webAppTodayUrl(): string {
  const base = webAppOrigin();
  return base ? `${base}/today` : '';
}
