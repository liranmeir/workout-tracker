import { afterEach, describe, expect, it, vi } from "vitest";
import { dayName, duration, fmtWeight, todayIndex } from "../days";

describe("dayName", () => {
  it("names a weekday", () => {
    expect(dayName(0)).toBe("יום ראשון");
    expect(dayName(6)).toBe("יום שבת");
  });
  it("handles no day", () => {
    expect(dayName(null)).toBe("ללא יום קבוע");
    expect(dayName(undefined)).toBe("ללא יום קבוע");
  });
});

describe("todayIndex", () => {
  afterEach(() => vi.useRealTimers());
  it("uses Israel time (Sunday = 0)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-05T12:00:00Z")); // Sunday
    expect(todayIndex()).toBe(0);
    vi.setSystemTime(new Date("2025-01-10T12:00:00Z")); // Friday
    expect(todayIndex()).toBe(5);
  });
});

describe("duration", () => {
  const from = new Date("2025-01-01T10:00:00Z");
  it("returns null when unfinished", () => {
    expect(duration(from, null)).toBeNull();
  });
  it("formats minutes and hours", () => {
    expect(duration(from, new Date("2025-01-01T10:45:00Z"))).toBe("45 דק׳");
    expect(duration(from, new Date("2025-01-01T11:05:00Z"))).toBe("1:05 ש׳");
  });
});

describe("fmtWeight", () => {
  it("returns null for empty values", () => {
    expect(fmtWeight(null)).toBeNull();
    expect(fmtWeight("")).toBeNull();
  });
  it("drops trailing .0 and keeps one decimal otherwise", () => {
    expect(fmtWeight("20.00")).toBe("20");
    expect(fmtWeight(22.5)).toBe("22.5");
  });
});
