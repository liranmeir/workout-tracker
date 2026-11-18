import WorkoutEditor from "@/components/WorkoutEditor";
import { requireAuth } from "@/lib/auth";

export default async function NewWorkout() {
  await requireAuth();
  return <WorkoutEditor />;
}
