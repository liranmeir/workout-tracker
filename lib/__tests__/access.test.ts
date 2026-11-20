import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";

let fake = createFakeDb();
vi.mock("../db", () => ({ db: () => fake.db }));

import { ownsSession, ownsWorkout } from "../access";

beforeEach(() => {
  fake = createFakeDb();
});

describe("ownsWorkout / ownsSession", () => {
  it("is true when the scoped query finds the row", async () => {
    fake.queue("select", [{ id: 5 }], [{ id: 7 }]);
    expect(await ownsWorkout(1, 5)).toBe(true);
    expect(await ownsSession(1, 7)).toBe(true);
  });
  it("is false when the row belongs to someone else (query finds nothing)", async () => {
    fake.queue("select", [], []);
    expect(await ownsWorkout(2, 5)).toBe(false);
    expect(await ownsSession(2, 7)).toBe(false);
  });
  it("rejects non-integer ids without querying", async () => {
    expect(await ownsWorkout(1, NaN)).toBe(false);
    expect(await ownsSession(1, 1.5)).toBe(false);
    expect(fake.calls).toHaveLength(0);
  });
});
