import { afterEach, describe, expect, it, vi } from "vitest";
import { dayName, dayWithDate, daysUntil, duration, fmtWeight, israelDateKey, planUpcoming, todayIndex } from "../days";

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

// Thursday 2025-01-09, midday in Israel
const THU = new Date("2025-01-09T10:00:00Z");

describe("israelDateKey", () => {
  it("uses the Israel calendar date, not UTC", () => {
    expect(israelDateKey(new Date("2025-01-09T22:30:00Z"))).toBe("2025-01-10");
  });
});

describe("daysUntil", () => {
  it("counts forward to the next weekday", () => {
    expect(daysUntil(4, THU)).toBe(0);
    expect(daysUntil(5, THU)).toBe(1);
    expect(daysUntil(0, THU)).toBe(3);
    expect(daysUntil(3, THU)).toBe(6);
  });
  it("can push today's slot to next week", () => {
    expect(daysUntil(4, THU, true)).toBe(7);
  });
});

describe("dayWithDate", () => {
  it("labels today and tomorrow", () => {
    expect(dayWithDate(4, 0, THU)).toBe("היום · חמישי 9.1");
    expect(dayWithDate(5, 1, THU)).toBe("מחר · שישי 10.1");
  });
  it("shows weekday and date further out, across month ends", () => {
    expect(dayWithDate(0, 3, THU)).toBe("יום ראשון · 12.1");
    expect(dayWithDate(3, 6, new Date("2025-01-30T10:00:00Z"))).toBe("יום רביעי · 5.2");
  });
});

describe("planUpcoming", () => {
  const w = (id: number, dayOfWeek: number | null, last: string | null = null) => ({ id, dayOfWeek, last });

  it("orders by what is due soonest and marks the first as next", () => {
    const { items, nextId } = planUpcoming([w(1, 0), w(2, 2), w(3, 5), w(4, null)], THU);
    expect(items.map((i) => i.w.id)).toEqual([3, 1, 2, 4]);
    expect(items.map((i) => i.offset)).toEqual([1, 3, 5, null]);
    expect(nextId).toBe(3);
  });
  it("treats today's workout as next until it is finished", () => {
    expect(planUpcoming([w(1, 4), w(2, 5)], THU).nextId).toBe(1);
    const done = planUpcoming([w(1, 4, "2025-01-09T07:00:00Z"), w(2, 5)], THU);
    expect(done.nextId).toBe(2);
    expect(done.items.at(-1)).toMatchObject({ offset: 7 });
  });
  it("falls back to the first workout when none has a day", () => {
    expect(planUpcoming([w(7, null), w(8, null)], THU).nextId).toBe(7);
  });
  it("handles an empty list", () => {
    expect(planUpcoming([], THU)).toEqual({ items: [], nextId: null });
  });
});
