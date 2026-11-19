import { describe, expect, it } from "vitest";
import { nextTag, startLabel } from "../labels";

describe("startLabel", () => {
  it("offers to start or continue", () => {
    expect(startLabel(false)).toBe("◀ התחל אימון");
    expect(startLabel(true)).toBe("◀ המשך אימון");
  });
});

describe("nextTag", () => {
  it("tells apart a coming workout from one in progress", () => {
    expect(nextTag(false)).toBe("האימון הבא");
    expect(nextTag(true)).toBe("אימון בעיצומו");
  });
});
