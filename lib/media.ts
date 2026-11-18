// Demo images come from the public-domain free-exercise-db (github.com/yuhonas/free-exercise-db).
// Frames for exercises used in the seeded workout are self-hosted in /public/demos;
// anything else picked from the catalog loads from GitHub, pinned to a commit.
const COMMIT = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
const REMOTE = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}/exercises`;

const LOCAL = new Set([
  "Dumbbell_Bench_Press",
  "One-Arm_Dumbbell_Row",
  "Goblet_Squat",
  "Seated_Dumbbell_Press",
  "Wide-Grip_Lat_Pulldown",
  "Stiff-Legged_Dumbbell_Deadlift",
  "Dumbbell_Step_Ups",
  "Plank",
  "Pallof_Press",
  "Dead_Bug",
]);

export function mediaFrames(id: string) {
  const base = LOCAL.has(id) ? "/demos" : REMOTE;
  const safe = encodeURIComponent(id);
  return [`${base}/${safe}/0.jpg`, `${base}/${safe}/1.jpg`] as const;
}
