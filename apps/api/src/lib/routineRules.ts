import { DAYS_OF_WEEK_ORDER, type DayOfWeek, type RoutineFrequency, type RoutineRule } from '@vector/types';

const DAY_SET = new Set<string>(DAYS_OF_WEEK_ORDER);

function parseStepOverrides(raw: unknown): { stepId: string; name: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { stepId: string; name: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.stepId === 'string' && typeof o.name === 'string') {
      out.push({ stepId: o.stepId, name: o.name });
    }
  }
  return out;
}

export function parseRoutineRules(input: unknown): { rules: RoutineRule[]; error: string | null } {
  if (!Array.isArray(input) || input.length === 0) {
    return { rules: [], error: 'At least one schedule rule is required.' };
  }

  const out: RoutineRule[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;

    const slot =
      o.slot === 'morning' || o.slot === 'afternoon' || o.slot === 'evening' ? o.slot : 'morning';

    const days = Array.isArray(o.days)
      ? (o.days.filter(d => typeof d === 'string' && DAY_SET.has(d)) as DayOfWeek[])
      : [];

    const frequency: RoutineFrequency | undefined =
      o.frequency === 'daily' || o.frequency === 'weekly' ? o.frequency : undefined;

    const stepOverrides = parseStepOverrides(o.stepOverrides);

    out.push({
      frequency,
      days,
      slot,
      stepOverrides,
    });
  }

  if (out.length === 0) {
    return { rules: [], error: 'At least one valid schedule rule is required.' };
  }

  for (const r of out) {
    if (r.frequency === 'weekly' && r.days.length === 0) {
      return { rules: [], error: 'Weekly schedule requires at least one weekday.' };
    }
  }

  return { rules: out, error: null };
}
