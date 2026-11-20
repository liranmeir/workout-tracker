import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { sessions, workouts } from "./schema";

/** True when the workout belongs to the user. Sessions, exercises and logs are owned through their workout. */
export async function ownsWorkout(userId: number, workoutId: number) {
  if (!Number.isInteger(workoutId)) return false;
  const [w] = await db()
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
  return !!w;
}

export async function ownsSession(userId: number, sessionId: number) {
  if (!Number.isInteger(sessionId)) return false;
  const [s] = await db()
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(workouts, eq(workouts.id, sessions.workoutId))
    .where(and(eq(sessions.id, sessionId), eq(workouts.userId, userId)));
  return !!s;
}
