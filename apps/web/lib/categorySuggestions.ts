/** Dedupe by case-insensitive key; preserve first spelling; sort for stable UI. */
export function mergeCategorySuggestions(
  stored: string[] | undefined,
  extra: (string | undefined | null)[],
): string[] {
  const map = new Map<string, string>();
  for (const raw of [...(stored ?? []), ...extra]) {
    if (raw == null || typeof raw !== 'string') continue;
    const t = raw.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (!map.has(k)) map.set(k, t);
  }
  return [...map.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
