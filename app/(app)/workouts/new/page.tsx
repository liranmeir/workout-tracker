import WorkoutEditor from "@/components/WorkoutEditor";
import { requireUser } from "@/lib/auth";

export default async function NewWorkout() {
  await requireUser();
  return <WorkoutEditor />;
}
