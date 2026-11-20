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

/** Split an exercise tip into short cues: one per line (or separated by ";"). */
export function parseCues(tip: string | null | undefined): string[] {
  if (!tip) return [];
  return tip
    .split(/[\n;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Reads a timed target like "40 שנ׳" or "30 שנ׳ לכל צד" from an exercise's reps.
 * Returns null for rep-based exercises ("8–10", "10 לכל רגל").
 */
export function parseTimed(reps: string | null | undefined): { seconds: number; rounds: number } | null {
  if (!reps) return null;
  const m = reps.match(/(\d+)\s*(?:שנ[׳'"]?|שניות|שנייה|sec|s\b)/i);
  const min = reps.match(/(\d+)\s*(?:דק[׳'"]?|דקות|דקה|min)/i);
  const seconds = m ? Number(m[1]) : min ? Number(min[1]) * 60 : 0;
  if (!seconds || seconds > 600) return null;
  return { seconds, rounds: /לכל צד/.test(reps) ? 2 : 1 };
}
