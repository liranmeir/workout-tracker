export const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const SECTIONS = ["חימום", "חלק עיקרי", "ליבה", "סיום ומתיחות"];

export function dayName(d: number | null | undefined) {
  return d == null ? "ללא יום קבוע" : `יום ${DAYS[d]}`;
}

export function todayIndex() {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", weekday: "short" }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

const fmt =new Intl.DateTimeFormat("he-IL", {
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
