import { and, eq, notInArray } from "drizzle-orm";
import { db } from "./db";
import { exercises, workouts } from "./schema";

export type ExerciseInput = {
  id?: number;
  section: string;
  name: string;
  kind: "sets" | "check";
  sets: number;
  reps: string;
  pair: string;
  tip: string;
  defaultWeight: string;
  mediaId: string;
};

export type WorkoutInput = {
  id?: number;
  name: string;
  dayOfWeek: number | null;
  note: string;
  exercises: ExerciseInput[];
};

const clean = (s: string | undefined | null) => (s ?? "").trim();
const orNull = (s: string | undefined | null) => clean(s) || null;

/** Create or update a workout and its exercises. Shared by the UI and the MCP server. */
export async function upsertWorkout(input: WorkoutInput): Promise<{ id: number } | { error: string }> {
  const name = clean(input.name);
  if (!name) return { error: "צריך שם לאימון" };
  const rows = input.exercises.filter((e) => clean(e.name));
  if (rows.length === 0) return { error: "צריך לפחות תרגיל אחד" };

  const day = input.dayOfWeek != null && input.dayOfWeek >= 0 && input.dayOfWeek <= 6 ? input.dayOfWeek : null;
  let workoutId = input.id;
  if (workoutId) {
    const [found] = await db().select({ id: workouts.id }).from(workouts).where(eq(workouts.id, workoutId));
    if (!found) return { error: `workout ${workoutId} not found` };
    await db().update(workouts).set({ name, dayOfWeek: day, note: orNull(input.note), archived: false }).where(eq(workouts.id, workoutId));
  } else {
    workoutId = (
      await db().insert(workouts).values({ name, dayOfWeek: day, note: orNull(input.note) }).returning({ id: workouts.id })
    )[0].id;
  }

  // Rows without an id reuse an existing exercise with the same name, so history stays linked.
  const existing = await db()
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(and(eq(exercises.workoutId, workoutId), eq(exercises.archived, false)));
  const byName = new Map(existing.map((e) => [e.name, e.id]));
  const validIds = new Set(existing.map((e) => e.id));

  const keep: number[] = [];
  for (const [i, e] of rows.entries()) {
    const w = clean(e.defaultWeight).replace(",", ".");
    const values = {
      workoutId,
      section: clean(e.section) || "חלק עיקרי",
      name: clean(e.name),
      kind: e.kind === "check" ? "check" : "sets",
      sets: e.kind === "check" ? 1 : Math.min(Math.max(Math.round(Number(e.sets) || 1), 1), 12),
      reps: clean(e.reps),
      pair: orNull(e.pair),
      tip: orNull(e.tip),
      defaultWeight: w && Number.isFinite(Number(w)) ? w : null,
      mediaId: /^[\w.()'-]+$/.test(clean(e.mediaId)) ? clean(e.mediaId) : null,
      position: i,
      archived: false,
    };
    const id = e.id ?? byName.get(values.name);
    if (id && (validIds.has(id) || e.id)) {
      await db().update(exercises).set(values).where(and(eq(exercises.id, id), eq(exercises.workoutId, workoutId)));
      keep.push(id);
    } else {
      keep.push((await db().insert(exercises).values(values).returning({ id: exercises.id }))[0].id);
    }
  }
  // Removed rows are archived, not deleted, so past sessions keep their data.
  await db()
    .update(exercises)
    .set({ archived: true })
    .where(and(eq(exercises.workoutId, workoutId), notInArray(exercises.id, keep)));

  return { id: workoutId };
}
