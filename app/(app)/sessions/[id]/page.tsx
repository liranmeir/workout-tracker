import { notFound } from "next/navigation";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, sessions, setLogs, weightLogs, workouts } from "@/lib/schema";
import { requireUser } from "@/lib/auth";
import Tracker, { type TrackerExercise } from "@/components/Tracker";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [s] = await db()
    .select({ id: sessions.id, startedAt: sessions.startedAt, finishedAt: sessions.finishedAt, workoutId: sessions.workoutId, name: workouts.name, note: workouts.note })
    .from(sessions)
    .innerJoin(workouts, eq(workouts.id, sessions.workoutId))
    .where(and(eq(sessions.id, id), eq(workouts.userId, userId)));
  if (!s) notFound();

  const [exs, done, weights] = await Promise.all([
    db().select().from(exercises).where(and(eq(exercises.workoutId, s.workoutId), eq(exercises.archived, false))).orderBy(asc(exercises.position)),
    db().select().from(setLogs).where(eq(setLogs.sessionId, id)),
    db().select().from(weightLogs).where(eq(weightLogs.sessionId, id)),
  ]);

  // Most recent weight per exercise from earlier sessions.
  const ids = exs.map((e) => e.id);
  const prevRows = ids.length
    ? await db()
        .select({ exerciseId: weightLogs.exerciseId, weight: weightLogs.weight, at: sessions.startedAt })
        .from(weightLogs)
        .innerJoin(sessions, eq(sessions.id, weightLogs.sessionId))
        .where(and(inArray(weightLogs.exerciseId, ids), ne(weightLogs.sessionId, id)))
        .orderBy(desc(sessions.startedAt))
    : [];
  const prev = new Map<number, string>();
  for (const r of prevRows) if (!prev.has(r.exerciseId)) prev.set(r.exerciseId, r.weight);

  const data: TrackerExercise[] = exs.map((e) => ({
    id: e.id,
    section: e.section,
    name: e.name,
    kind: e.kind === "check" ? "check" : "sets",
    sets: e.sets,
    reps: e.reps,
    pair: e.pair,
    tip: e.tip,
    mediaId: e.mediaId,
    lastWeight: prev.get(e.id) ?? null,
    suggested: prev.get(e.id) ?? e.defaultWeight,
  }));

  return (
    <Tracker
      sessionId={s.id}
      title={s.name}
      note={s.note}
      startedAt={s.startedAt.toISOString()}
      finished={!!s.finishedAt}
      exercises={data}
      initialDone={done.map((d) => `${d.exerciseId}-${d.setIndex}`)}
      initialWeights={Object.fromEntries(weights.map((w) => [w.exerciseId, w.weight]))}
    />
  );
}
