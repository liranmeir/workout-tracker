import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises, workouts } from "@/lib/schema";
import { requireAuth } from "@/lib/auth";
import WorkoutEditor from "@/components/WorkoutEditor";
import { fmtWeight } from "@/lib/days";

export const dynamic = "force-dynamic";

export default async function EditWorkout({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [w] = await db().select().from(workouts).where(eq(workouts.id, id));
  if (!w || w.archived) notFound();
  const exs = await db()
    .select()
    .from(exercises)
    .where(and(eq(exercises.workoutId, id), eq(exercises.archived, false)))
    .orderBy(asc(exercises.position));

  return (
    <WorkoutEditor
      initial={{
        id: w.id,
        name: w.name,
        dayOfWeek: w.dayOfWeek,
        note: w.note ?? "",
        exercises: exs.map((e) => ({
          id: e.id,
          section: e.section,
          name: e.name,
          kind: e.kind === "check" ? "check" : "sets",
          sets: e.sets,
          reps: e.reps,
          pair: e.pair ?? "",
          tip: e.tip ?? "",
          defaultWeight: fmtWeight(e.defaultWeight) ?? "",
          mediaId: e.mediaId ?? "",
        })),
      }}
    />
  );
}
