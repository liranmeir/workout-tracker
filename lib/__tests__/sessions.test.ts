import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";

let fake = createFakeDb();
vi.mock("../db", () => ({ db: () => fake.db }));

import { restartSessionClock } from "../sessions";

beforeEach(() => {
  fake = createFakeDb();
});

describe("restartSessionClock", () => {
  it("sets started_at to now and returns it", async () => {
    const now = new Date("2026-11-20T05:55:00Z");
    fake.queue("update", [{ startedAt: now }]);
    expect(await restartSessionClock(2, now)).toEqual({ startedAt: now.toISOString() });
    expect(fake.of("update")[0].set).toEqual({ startedAt: now });
  });

  it("only touches started_at, keeping logged sets", async () => {
    fake.queue("update", [{ startedAt: new Date() }]);
    await restartSessionClock(2);
    expect(Object.keys(fake.of("update")[0].set as object)).toEqual(["startedAt"]);
    expect(fake.of("delete")).toHaveLength(0);
  });

  it("returns an error for a missing session", async () => {
    fake.queue("update", []);
    expect(await restartSessionClock(99)).toEqual({ error: "session 99 not found" });
  });

  it("rejects an invalid id without touching the db", async () => {
    expect(await restartSessionClock(0)).toEqual({ error: "invalid session" });
    expect(await restartSessionClock(1.5)).toEqual({ error: "invalid session" });
    expect(fake.calls).toHaveLength(0);
  });
});
