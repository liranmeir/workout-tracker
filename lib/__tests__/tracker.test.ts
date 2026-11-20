import { describe, expect, it } from "vitest";
import { fmtClock, parseCues, progress } from "../tracker";

describe("fmtClock", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(fmtClock(0)).toBe("0:00");
    expect(fmtClock(65)).toBe("1:05");
    expect(fmtClock(21 * 60 + 24)).toBe("21:24");
  });
  it("keeps counting minutes past an hour", () => {
    expect(fmtClock(582 * 60 + 52)).toBe("582:52");
  });
  it("clamps negatives and drops fractions", () => {
    expect(fmtClock(-5)).toBe("0:00");
    expect(fmtClock(9.9)).toBe("0:09");
  });
});

describe("progress", () => {
  it("counts only planned keys that are done", () => {
    const keys = ["1-0", "1-1", "2-0", "3-0"];
    expect(progress(keys, new Set(["1-0", "2-0", "9-9"]))).toEqual({ count: 2, total: 4, pct: 50 });
  });
  it("rounds the percentage", () => {
    const keys = Array.from({ length: 26 }, (_, i) => `x-${i}`);
    expect(progress(keys, new Set(keys.slice(0, 7))).pct).toBe(27);
  });
  it("handles an empty plan", () => {
    expect(progress([], new Set())).toEqual({ count: 0, total: 0, pct: 0 });
  });
});

describe("parseCues", () => {
  it("splits on new lines and semicolons and trims", () => {
    expect(parseCues("  גב ישר \nירידה איטית;  נושפים בדחיפה ")).toEqual(["גב ישר", "ירידה איטית", "נושפים בדחיפה"]);
  });
  it("keeps commas inside a cue", () => {
    expect(parseCues("חזה פתוח, מושכים לבטן")).toEqual(["חזה פתוח, מושכים לבטן"]);
  });
  it("drops blank lines and handles empty tips", () => {
    expect(parseCues("א\n\n \nב")).toEqual(["א", "ב"]);
    expect(parseCues("")).toEqual([]);
    expect(parseCues(null)).toEqual([]);
    expect(parseCues(undefined)).toEqual([]);
  });
});
