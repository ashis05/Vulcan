/** Local-date helpers — never use `toISOString()` for calendar-day buckets. */

/** Local calendar date (yyyy-mm-dd). */
export function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local calendar date (yyyy-mm-dd) for an ISO timestamp. */
export function localDayFromIso(iso: string): string {
  return localDateString(new Date(iso));
}

/**
 * Calendar date (yyyy-mm-dd) in Pacific time. The AI quota day follows Gemini's
 * free-tier reset (midnight Pacific), not the device's local date.
 */
export function pacificDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** UTC ISO bounds [start, end) covering one local calendar day (yyyy-mm-dd). */
export function dayRangeIso(dateIso: string): { start: string; end: string } {
  const [y, m, d] = dateIso.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = addDays(start, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Short weekday + day label, e.g. "Thu, Sep 17". */
export function formatLongDay(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

/** The last `count` local dates ending today, oldest → newest. */
export function recentDays(count: number, from: Date = new Date()): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(localDateString(addDays(from, -i)));
  }
  return days;
}
