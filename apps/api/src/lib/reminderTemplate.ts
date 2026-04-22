import type { TimeSlot } from '@vector/types';
import { ENV } from '@vector/config';
import defaultTemplateJson from '../config/reminder-template.default.json';

export type ReminderParseMode = 'HTML';

export interface ReminderTemplate {
  parseMode: ReminderParseMode;
  slotLabels: Record<string, string>;
  slotEmoji: Record<string, string>;
  header: string;
  taskLine: string;
  footer: string;
}

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asStringMap(v: unknown): Record<string, string> {
  if (!isRecord(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val;
  }
  return out;
}

function parseFullTemplate(raw: unknown): ReminderTemplate {
  if (!isRecord(raw)) {
    throw new Error('reminder template must be a JSON object');
  }
  const header = raw.header;
  const taskLine = raw.taskLine;
  const footer = raw.footer;
  if (typeof header !== 'string' || typeof taskLine !== 'string' || typeof footer !== 'string') {
    throw new Error('reminder template requires string fields: header, taskLine, footer');
  }
  return {
    parseMode: 'HTML',
    slotLabels: asStringMap(raw.slotLabels),
    slotEmoji: asStringMap(raw.slotEmoji),
    header,
    taskLine,
    footer,
  };
}

function parsePartialTemplate(raw: unknown): Partial<ReminderTemplate> {
  if (!isRecord(raw)) return {};
  const out: Partial<ReminderTemplate> = {};
  if (typeof raw.header === 'string') out.header = raw.header;
  if (typeof raw.taskLine === 'string') out.taskLine = raw.taskLine;
  if (typeof raw.footer === 'string') out.footer = raw.footer;
  if (raw.parseMode === 'HTML') out.parseMode = 'HTML';
  const sl = asStringMap(raw.slotLabels);
  if (Object.keys(sl).length) out.slotLabels = sl;
  const se = asStringMap(raw.slotEmoji);
  if (Object.keys(se).length) out.slotEmoji = se;
  return out;
}

function deepMergeTemplate(base: ReminderTemplate, patch: Partial<ReminderTemplate>): ReminderTemplate {
  return {
    parseMode: patch.parseMode ?? base.parseMode,
    slotLabels: { ...base.slotLabels, ...(patch.slotLabels ?? {}) },
    slotEmoji: { ...base.slotEmoji, ...(patch.slotEmoji ?? {}) },
    header: patch.header ?? base.header,
    taskLine: patch.taskLine ?? base.taskLine,
    footer: patch.footer ?? base.footer,
  };
}

let cached: ReminderTemplate | null = null;
let cachedEnvFingerprint = '';

function loadDefault(): ReminderTemplate {
  return parseFullTemplate(defaultTemplateJson);
}

/** Default JSON on disk + optional merge from TELEGRAM_REMINDER_TEMPLATE_JSON. */
export function getReminderTemplate(): ReminderTemplate {
  const raw = ENV.TELEGRAM_REMINDER_TEMPLATE_JSON.trim();
  const fingerprint = raw.length ? raw : '';
  if (cached && cachedEnvFingerprint === fingerprint) {
    return cached;
  }

  const base = loadDefault();
  if (!raw) {
    cached = base;
    cachedEnvFingerprint = fingerprint;
    return cached;
  }

  try {
    const partial = parsePartialTemplate(JSON.parse(raw) as unknown);
    cached = deepMergeTemplate(base, partial);
  } catch (e) {
    console.error('TELEGRAM_REMINDER_TEMPLATE_JSON invalid; using default template only:', e);
    cached = base;
  }
  cachedEnvFingerprint = fingerprint;
  return cached;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyVars(str: string, vars: Record<string, string>): string {
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

function slotLabel(t: ReminderTemplate, slot: TimeSlot): string {
  return t.slotLabels[slot] ?? slot;
}

function slotEmojiChar(t: ReminderTemplate, slot: TimeSlot): string {
  return t.slotEmoji[slot] ?? '▪️';
}

export function sortReminderItems<T extends { title: string; slot: TimeSlot }>(items: T[]): T[] {
  const rank = (s: TimeSlot) => {
    const i = SLOT_ORDER.indexOf(s);
    return i === -1 ? 99 : i;
  };
  return [...items].sort((a, b) => {
    const dr = rank(a.slot) - rank(b.slot);
    if (dr !== 0) return dr;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
}

export function buildReminderMessage(
  template: ReminderTemplate,
  date: string,
  items: { title: string; slot: TimeSlot }[],
): { text: string; parseMode: ReminderParseMode } {
  const sorted = sortReminderItems(items);
  const count = String(sorted.length);

  const headerVars: Record<string, string> = {
    date: escapeHtml(date),
    count,
  };
  let text = applyVars(template.header, headerVars);

  for (const item of sorted) {
    const lineVars: Record<string, string> = {
      title: escapeHtml(item.title),
      slot: item.slot,
      slot_label: escapeHtml(slotLabel(template, item.slot)),
      slot_emoji: slotEmojiChar(template, item.slot),
    };
    text += applyVars(template.taskLine, lineVars);
  }

  text += applyVars(template.footer, { date: headerVars.date, count });

  return { text, parseMode: template.parseMode };
}
