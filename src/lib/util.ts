export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

/* ------------------------------------------------------------------ dates */

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function today(): string { return isoDate(new Date()); }

/** Start of the week containing `date`. weekStart: 1 = Monday, 0 = Sunday. */
export function weekStartOf(date: string, weekStart: 0 | 1): string {
  const d = parseIso(date);
  const dow = d.getDay(); // 0 Sun
  const diff = weekStart === 1 ? (dow + 6) % 7 : dow;
  d.setDate(d.getDate() - diff);
  return isoDate(d);
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 0 = Monday … 6 = Sunday */
export function mondayIndex(date: string): number {
  return (parseIso(date).getDay() + 6) % 7;
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function fmtDay(date: string): string {
  const d = parseIso(date);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function fmtRange(start: string): string {
  const s = parseIso(start);
  const e = parseIso(addDays(start, 6));
  const mon = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()} – ${e.getDate()} ${mon(e)}`
    : `${s.getDate()} ${mon(s)} – ${e.getDate()} ${mon(e)}`;
}

export function fmtMinutes(min: number): string {
  if (!min) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function round(n: number, dp = 0): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
