export const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const SECTIONS = ["חימום", "חלק עיקרי", "ליבה", "סיום ומתיחות"];

export function dayName(d: number | null | undefined) {
  return d == null ? "ללא יום קבוע" : `יום ${DAYS[d]}`;
}

export function todayIndex(now = new Date()) {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

const fmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  weekday: "short",
  day: "numeric",
  month: "numeric",
});
export function shortDate(d: Date) {
  return fmt.format(d);
}

export function duration(from: Date, to: Date | null) {
  if (!to) return null;
  const m = Math.round((to.getTime() - from.getTime()) / 60000);
  return m < 60 ? `${m} דק׳` : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} ש׳`;
}

export function fmtWeight(w: string | number | null | undefined) {
  if (w == null || w === "") return null;
  const n = Number(w);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const ilDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });
/** Calendar date in Israel as "YYYY-MM-DD". */
export function israelDateKey(d: Date) {
  return ilDate.format(d);
}

const MS_DAY = 86_400_000;
const dm = new Intl.DateTimeFormat("he-IL", { timeZone: "UTC", day: "numeric", month: "numeric" });

/** Calendar date (Israel) `offset` days from `now`, as a UTC-noon Date for stable formatting. */
function dateAt(now: Date, offset: number) {
  const [y, m, d] = israelDateKey(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12) + offset * MS_DAY);
}

/** Days from today until the next `dayOfWeek` (0 = today). `skipToday` pushes today's slot to next week. */
export function daysUntil(dayOfWeek: number, now = new Date(), skipToday = false) {
  const diff = (dayOfWeek - todayIndex(now) + 7) % 7;
  return diff === 0 && skipToday ? 7 : diff;
}

/** "היום" / "מחר" / "יום שלישי", plus the date: "יום ראשון · 22.11". */
export function dayWithDate(dayOfWeek: number, offset: number, now = new Date()) {
  const date = dm.format(dateAt(now, offset)).replace("/", ".");
  const rel = offset === 0 ? "היום" : offset === 1 ? "מחר" : `יום ${DAYS[dayOfWeek]}`;
  return offset <= 1 ? `${rel} · ${DAYS[dayOfWeek]} ${date}` : `${rel} · ${date}`;
}

export type Schedulable = { id: number; dayOfWeek: number | null; last: string | null };

/**
 * Orders workouts by how soon they are due (today first, then upcoming days; no-day workouts last)
 * and tells which one is next. A workout already finished today counts as due next week.
 */
export function planUpcoming<T extends Schedulable>(list: T[], now = new Date()) {
  const todayKey = israelDateKey(now);
  const items = list.map((w) => {
    if (w.dayOfWeek == null) return { w, offset: null as number | null };
    const doneToday = w.last != null && israelDateKey(new Date(w.last)) === todayKey;
    return { w, offset: daysUntil(w.dayOfWeek, now, doneToday) };
  });
  items.sort((a, b) => (a.offset ?? 99) - (b.offset ?? 99) || a.w.id - b.w.id);
  const nextId = items.find((i) => i.offset != null)?.w.id ?? items[0]?.w.id ?? null;
  return { items, nextId };
}
