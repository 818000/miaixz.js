import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  addCalendarMonths,
  addCalendarYears,
  createCalendarMonth,
  daysInMonth,
  parseIsoDate,
  parseIsoTime,
  stepIsoTime,
} from "../../../src/components/date/index.js";

describe("date model", () => {
  it("handles Gregorian leap and boundary arithmetic", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addCalendarDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addCalendarMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addCalendarYears("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("creates a deterministic six-week month without Date", () => {
    const cells = createCalendarMonth("2026-09", 1);
    expect(cells).toHaveLength(42);
    expect(cells[0]?.date).toBe("2026-08-31");
    expect(cells.at(-1)?.date).toBe("2026-10-11");
  });

  it("strictly parses dates and wall time", () => {
    expect(parseIsoDate("2025-02-29")).toBeNull();
    expect(parseIsoTime("23:59")).toEqual({ hour: 23, minute: 59, second: 0 });
    expect(parseIsoTime("24:00")).toBeNull();
    expect(stepIsoTime("23:50", 900, "00:00", "23:59")).toBe("23:59");
  });
});
