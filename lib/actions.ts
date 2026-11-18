"use server";

import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sessions, setLogs, weightLogs, workouts } from "./schema";
import { requireAuth, signIn, signOut } from "./auth";
import { upsertWorkout, type WorkoutInput } from "./workouts";

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

export type { ExerciseInput, WorkoutInput } from "./workouts";

export async function saveWorkout(input: WorkoutInput) {
  await requireAuth();
  const res = await upsertWorkout(input);
  if ("error" in res) return res;
  revalidatePath("/");
  redirect("/");
}

export async function archiveWorkout(workoutId: number) {
  await requireAuth();
  await db().update(workouts).set({ archived: true }).where(eq(workouts.id, workoutId));
  revalidatePath("/");
  redirect("/");
}
