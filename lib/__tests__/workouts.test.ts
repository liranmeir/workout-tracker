import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";

let fake = createFakeDb();
vi.mock("../db", () => ({ db: () => fake.db }));

import { upsertWorkout, type ExerciseInput } from "../workouts";

const ex = (o: Partial<ExerciseInput> = {}): ExerciseInput => ({
  section: "חלק עיקרי",
  name: "סקוואט",
  kind: "sets",
  sets: 3,
  reps: "8",
  pair: "",
  tip: "",
  defaultWeight: "",
  mediaId: "",
  ...o,
});
const input = (o: Partial<Parameters<typeof upsertWorkout>[0]> = {}) => ({
  name: "רגליים",
  dayOfWeek: 1,
  note: "",
  exercises: [ex()],
  ...o,
});

beforeEach(() => {
  fake = createFakeDb();
});

describe("upsertWorkout validation", () => {
  it("rejects an empty name without touching the db", async () => {
    expect(await upsertWorkout(input({ name: "   " }))).toEqual({ error: "צריך שם לאימון" });
    expect(fake.calls).toHaveLength(0);
  });
  it("rejects a workout with no named exercises", async () => {
    expect(await upsertWorkout(input({ exercises: [ex({ name: " " })] }))).toEqual({ error: "צריך לפחות תרגיל אחד" });
    expect(fake.calls).toHaveLength(0);
  });
  it("returns an error when updating a missing workout", async () => {
    fake.queue("select", []);
    expect(await upsertWorkout(input({ id: 99 }))).toEqual({ error: "workout 99 not found" });
  });
});

describe("upsertWorkout creating", () => {
  beforeEach(() => {
    fake.queue("insert", [{ id: 7 }], [{ id: 70 }]);
    fake.queue("select", []);
  });

  it("returns the new id and trims/normalises the workout", async () => {
    const res = await upsertWorkout(input({ name: "  רגליים ", note: "  ", dayOfWeek: 9 }));
    expect(res).toEqual({ id: 7 });
    expect(fake.of("insert")[0].values).toEqual({ name: "רגליים", dayOfWeek: null, note: null });
  });

  it("sanitises exercise fields", async () => {
    await upsertWorkout(
      input({ exercises: [ex({ sets: 99, defaultWeight: "22,5", mediaId: "bad id!", pair: " ", tip: " tip " })] }),
    );
    expect(fake.of("insert")[1].values).toMatchObject({
      workoutId: 7,
      sets: 12,
      defaultWeight: "22.5",
      mediaId: null,
      pair: null,
      tip: "tip",
      position: 0,
    });
  });

  it("forces check items to a single set and drops non-numeric weights", async () => {
    await upsertWorkout(input({ exercises: [ex({ kind: "check", sets: 5, defaultWeight: "abc" })] }));
    expect(fake.of("insert")[1].values).toMatchObject({ kind: "check", sets: 1, defaultWeight: null });
  });

  it("archives rows that were removed instead of deleting them", async () => {
    await upsertWorkout(input());
    expect(fake.of("delete")).toHaveLength(0);
    expect(fake.of("update").at(-1)?.set).toEqual({ archived: true });
  });
});

describe("upsertWorkout updating", () => {
  it("reuses an existing exercise with the same name so history stays linked", async () => {
    fake.queue("select", [{ id: 5 }], [{ id: 50, name: "סקוואט" }]);
    expect(await upsertWorkout(input({ id: 5 }))).toEqual({ id: 5 });
    expect(fake.of("insert")).toHaveLength(0);
    expect(fake.of("update").some((c) => (c.set as { name?: string })?.name === "סקוואט")).toBe(true);
  });
});
