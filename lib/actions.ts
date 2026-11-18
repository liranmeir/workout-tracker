"use server";

import { and, eq, gt, isNull, desc, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { exercises, sessions, setLogs, weightLogs, workouts } from "./schema";
import { requireAuth, signIn, signOut } from "./auth";

/* ---------- auth ---------- */

export async function loginAction(_: unknown, form: FormData) {
  const ok = await signIn(String(form.get("password") ?? ""));
  if (!ok) return { error: "סיסמה שגויה" };
  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

/* ---------- sessions ---------- */

export async function startSession(workoutId: number) {
  await requireAuth();
  // Resume an unfinished session from the last 12 hours instead of opening a new one.
  const since = new Date(Date.now() - 12 * 3600_000);
  const [open] = await db()
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.workoutId, workoutId), isNull(sessions.finishedAt), gt(sessions.startedAt, since)))
    .orderBy(desc(sessions.startedAt))
    .limit(1);
  const id =
    open?.id ??
    (await db().insert(sessions).values({ workoutId }).returning({ id: sessions.id }))[0].id;
  redirect(`/sessions/${id}`);
}

export async function toggleSet(sessionId: number, exerciseId: number, setIndex: number, done: boolean) {
  await requireAuth();
  if (done) {
    await db().insert(setLogs).values({ sessionId, exerciseId, setIndex }).onConflictDoNothing();
  } else {
    await db()
      .delete(setLogs)
      .where(and(eq(setLogs.sessionId, sessionId), eq(setLogs.exerciseId, exerciseId), eq(setLogs.setIndex, setIndex)));
  }
}

export async function saveWeight(sessionId: number, exerciseId: number, weight: string) {
  await requireAuth();
  const n = Number(weight.replace(",", "."));
  if (weight.trim() === "" || !Number.isFinite(n) || n < 0) {
    await db()
      .delete(weightLogs)
      .where(and(eq(weightLogs.sessionId, sessionId), eq(weightLogs.exerciseId, exerciseId)));
    return;
  }
  await db()
    .insert(weightLogs)
    .values({ sessionId, exerciseId, weight: String(n) })
    .onConflictDoUpdate({
      target: [weightLogs.sessionId, weightLogs.exerciseId],
      set: { weight: String(n), updatedAt: new Date() },
    });
}

export async function finishSession(sessionId: number) {
  await requireAuth();
  await db().update(sessions).set({ finishedAt: new Date() }).where(eq(sessions.id, sessionId));
  revalidatePath("/");
  revalidatePath("/history");
  redirect("/history");
}

export async function reopenSession(sessionId: number) {
  await requireAuth();
  await db().update(sessions).set({ finishedAt: null }).where(eq(sessions.id, sessionId));
  revalidatePath(`/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: number) {
  await requireAuth();
  await db().delete(sessions).where(eq(sessions.id, sessionId));
  revalidatePath("/history");
  revalidatePath("/");
}

/* ---------- workouts ---------- */

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

export async function saveWorkout(input: WorkoutInput) {
  await requireAuth();
  const name = clean(input.name);
  if (!name) return { error: "צריך שם לאימון" };
  const rows = input.exercises.filter((e) => clean(e.name));
  if (rows.length === 0) return { error: "צריך לפחות תרגיל אחד" };

  const day = input.dayOfWeek != null && input.dayOfWeek >= 0 && input.dayOfWeek <= 6 ? input.dayOfWeek : null;
  let workoutId = input.id;
  if (workoutId) {
    await db().update(workouts).set({ name, dayOfWeek: day, note: orNull(input.note) }).where(eq(workouts.id, workoutId));
  } else {
    workoutId = (
      await db().insert(workouts).values({ name, dayOfWeek: day, note: orNull(input.note) }).returning({ id: workouts.id })
    )[0].id;
  }

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
      position: i,
      archived: false,
    };
    if (e.id) {
      await db().update(exercises).set(values).where(and(eq(exercises.id, e.id), eq(exercises.workoutId, workoutId)));
      keep.push(e.id);
    } else {
      keep.push((await db().insert(exercises).values(values).returning({ id: exercises.id }))[0].id);
    }
  }
  // Removed rows are archived, not deleted, so past sessions keep their data.
  await db()
    .update(exercises)
    .set({ archived: true })
    .where(and(eq(exercises.workoutId, workoutId), notInArray(exercises.id, keep)));

  revalidatePath("/");
  redirect("/");
}

export async function archiveWorkout(workoutId: number) {
  await requireAuth();
  await db().update(workouts).set({ archived: true }).where(eq(workouts.id, workoutId));
  revalidatePath("/");
  redirect("/");
}
