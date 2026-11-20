import { beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createFakeDb } from "./helpers/fakeDb";

let fake = createFakeDb();
vi.mock("../db", () => ({ db: () => fake.db }));

import { buildMcpServer } from "../mcp";

async function connect() {
  const server = buildMcpServer({ id: 1, name: "לירן" });
  const client = new Client({ name: "test", version: "1.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}
const call = async (name: string, args: Record<string, unknown> = {}) => {
  const res = (await (await connect()).callTool({ name, arguments: args })) as {
    isError?: boolean;
    content: { text: string }[];
  };
  return { isError: !!res.isError, text: res.content[0].text };
};

beforeEach(() => {
  fake = createFakeDb();
});

describe("mcp server", () => {
  it("exposes the expected tools", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ["delete_workout", "get_history", "get_progress", "list_workouts", "log_workout", "save_workout", "search_exercise_demos", "set_workout_day"].sort(),
    );
  });

  it("names the user in the tool descriptions", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.find((t) => t.name === "list_workouts")?.description).toContain("לירן's workout plans");
    expect(tools.find((t) => t.name === "get_history")?.description).toContain("Sessions לירן actually did");
  });

  it("list_workouts returns an empty list when there are no workouts", async () => {
    fake.queue("select", []);
    expect(JSON.parse((await call("list_workouts")).text)).toEqual([]);
  });

  it("list_workouts maps rows to the public shape", async () => {
    fake.queue(
      "select",
      [{ id: 1, name: "A", dayOfWeek: 0, note: null }],
      [{ id: 10, workoutId: 1, section: "s", name: "Squat", kind: "sets", sets: 3, reps: "8", pair: null, tip: null, defaultWeight: "20.00", mediaId: null }],
    );
    const [w] = JSON.parse((await call("list_workouts")).text);
    expect(w).toMatchObject({ id: 1, day: "ראשון", day_of_week: 0 });
    expect(w.exercises[0]).toMatchObject({ id: 10, default_weight: 20 });
  });

  it("set_workout_day reports a missing workout as an error", async () => {
    fake.queue("update", []);
    const r = await call("set_workout_day", { workout_id: 5, day_of_week: 2 });
    expect(r).toEqual({ isError: true, text: "workout 5 not found" });
  });

  it("set_workout_day rejects an out-of-range day via the schema", async () => {
    const r = await call("set_workout_day", { workout_id: 5, day_of_week: 9 });
    expect(r.isError).toBe(true);
    expect(fake.calls).toHaveLength(0);
  });

  it("delete_workout archives and returns the name", async () => {
    fake.queue("update", [{ name: "A" }]);
    expect(JSON.parse((await call("delete_workout", { workout_id: 1 })).text)).toEqual({ deleted: "A" });
    expect(fake.of("update")[0].set).toEqual({ archived: true });
  });

  it("log_workout rejects an invalid date", async () => {
    fake.queue("select", [{ id: 1, name: "A", dayOfWeek: 0, note: null }], []);
    const r = await call("log_workout", { workout_id: 1, date: "not-a-date" });
    expect(r).toEqual({ isError: true, text: "invalid date" });
  });

  it("log_workout with all_done logs every planned set", async () => {
    fake.queue(
      "select",
      [{ id: 1, name: "A", dayOfWeek: null, note: null }],
      [{ id: 10, workoutId: 1, section: "s", name: "Squat", kind: "sets", sets: 3, reps: "", pair: null, tip: null, defaultWeight: null, mediaId: null }],
    );
    fake.queue("insert", [{ id: 99 }]);
    const out = JSON.parse((await call("log_workout", { workout_id: 1, all_done: true })).text);
    expect(out).toMatchObject({ logged: true, session_id: 99, sets_logged: 3, unknown_exercise_ids: [] });
  });

  it("search_exercise_demos matches all words and requires 2+ chars", async () => {
    const hits = JSON.parse((await call("search_exercise_demos", { query: "dumbbell row" })).text);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(15);
    expect(hits[0]).toHaveProperty("media_id");
    expect(JSON.parse((await call("search_exercise_demos", { query: "zzzzqqq" })).text)).toEqual([]);
    expect((await call("search_exercise_demos", { query: "a" })).isError).toBe(true);
  });
});
