/** Pure helpers for the workout editor (kept out of the component so they can be tested). */

type Row = { name: string; section: string; kind: "sets" | "check"; sets: number; reps: string; defaultWeight: string };

/** Same bounds the server enforces in upsertWorkout. */
export function clampSets(n: number) {
  return Math.min(Math.max(Math.round(Number(n) || 1), 1), 12);
}

/** One-line summary shown on a collapsed exercise row, e.g. "3 × 10 · 20 ק״ג". */
export function exerciseSummary(e: Pick<Row, "kind" | "sets" | "reps" | "defaultWeight">) {
  const reps = e.reps.trim();
  if (e.kind === "check") return reps ? `סימון · ${reps}` : "סימון";
  const base = reps ? `${e.sets} × ${reps}` : `${e.sets} סטים`;
  const w = e.defaultWeight.trim();
  return w ? `${base} · ${w} ק״ג` : base;
}

/** Totals for rows that have a name (unnamed rows are dropped on save). A checklist item counts as one set. */
export function workoutTotals(rows: Pick<Row, "name" | "kind" | "sets">[]) {
  const named = rows.filter((r) => r.name.trim());
  return { exercises: named.length, sets: named.reduce((n, r) => n + (r.kind === "check" ? 1 : r.sets), 0) };
}

/** For each row: true when it starts a new section (so the list can show a heading). */
export function sectionStarts(rows: Pick<Row, "section">[]) {
  return rows.map((r, i) => i === 0 || r.section.trim() !== rows[i - 1].section.trim());
}
