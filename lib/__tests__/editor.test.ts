import { describe, expect, it } from "vitest";
import { clampSets, exerciseSummary, sectionStarts, workoutTotals } from "../editor";

describe("clampSets", () => {
  it("keeps values in 1..12 and rounds", () => {
    expect(clampSets(0)).toBe(1);
    expect(clampSets(-4)).toBe(1);
    expect(clampSets(3.6)).toBe(4);
    expect(clampSets(99)).toBe(12);
    expect(clampSets(NaN)).toBe(1);
  });
});

describe("exerciseSummary", () => {
  it("shows sets x reps and weight", () => {
    expect(exerciseSummary({ kind: "sets", sets: 3, reps: "10", defaultWeight: "" })).toBe("3 × 10");
    expect(exerciseSummary({ kind: "sets", sets: 4, reps: "8", defaultWeight: "22.5" })).toBe("4 × 8 · 22.5 ק״ג");
  });
  it("falls back when reps are empty", () => {
    expect(exerciseSummary({ kind: "sets", sets: 3, reps: " ", defaultWeight: "" })).toBe("3 סטים");
  });
  it("describes checklist items", () => {
    expect(exerciseSummary({ kind: "check", sets: 1, reps: "", defaultWeight: "" })).toBe("סימון");
    expect(exerciseSummary({ kind: "check", sets: 1, reps: "30 שנ׳", defaultWeight: "" })).toBe("סימון · 30 שנ׳");
  });
});

describe("workoutTotals", () => {
  it("counts named rows, a checklist item as one set", () => {
    const rows = [
      { name: "סקוואט", kind: "sets" as const, sets: 4 },
      { name: "מתיחות", kind: "check" as const, sets: 9 },
      { name: "  ", kind: "sets" as const, sets: 3 },
    ];
    expect(workoutTotals(rows)).toEqual({ exercises: 2, sets: 5 });
  });
  it("handles an empty list", () => {
    expect(workoutTotals([])).toEqual({ exercises: 0, sets: 0 });
  });
});

describe("sectionStarts", () => {
  it("flags the first row of each run of equal sections", () => {
    const rows = ["חימום", "חימום", "חלק עיקרי", "חלק עיקרי ", "חימום"].map((section) => ({ section }));
    expect(sectionStarts(rows)).toEqual([true, false, true, false, true]);
  });
});
