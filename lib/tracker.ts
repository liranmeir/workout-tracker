/** Elapsed/rest clock: seconds → "m:ss" (minutes keep counting past 60). */
export const fmtClock = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

/** How many of the planned set keys are done, and the rounded percentage. */
export function progress(keys: string[], done: Set<string>) {
  const count = keys.filter((k) => done.has(k)).length;
  return { count, total: keys.length, pct: keys.length ? Math.round((count / keys.length) * 100) : 0 };
}
