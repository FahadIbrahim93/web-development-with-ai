/**
 * Unit tests for the pure domain rules in src/lib/courseRules.ts.
 *
 * These functions are the invariants of the product — the completion rule,
 * pricing display, and booking validation are consumed by both the React
 * frontend and the Convex backend, so a regression here would be visible to
 * learners and the course owner. They are dependency-free on purpose, which
 * makes them fast to run in CI (see .github/workflows/ci.yml).
 */
import { describe, expect, it } from "vitest";

import {
  BOOKING_SLOTS,
  formatPrice,
  isBookableSlot,
  isModuleComplete,
  isValidBookingDate,
  isValidEmail,
  modulePercent,
} from "./courseRules";

/* ------------------------------------------------------------------ */
/* isModuleComplete — the single completion rule                       */
/* ------------------------------------------------------------------ */

describe("isModuleComplete", () => {
  const threeSections = { sections: [{}, {}, {}] } as never;
  const empty = { sections: [] } as never;

  it("is false when no sections are done", () => {
    expect(isModuleComplete(threeSections, 0)).toBe(false);
  });

  it("is false while any section remains", () => {
    expect(isModuleComplete(threeSections, 2)).toBe(false);
  });

  it("is true exactly when all sections are done", () => {
    expect(isModuleComplete(threeSections, 3)).toBe(true);
  });

  it("stays true beyond completion (progress only grows)", () => {
    expect(isModuleComplete(threeSections, 5)).toBe(true);
  });

  it("is never complete for modules with no sections", () => {
    expect(isModuleComplete(empty, 0)).toBe(false);
    expect(isModuleComplete(empty, 3)).toBe(false);
  });

  it("is never complete for unknown modules (missing content)", () => {
    expect(isModuleComplete(undefined, 3)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* modulePercent                                                       */
/* ------------------------------------------------------------------ */

describe("modulePercent", () => {
  const fourSections = { sections: [{}, {}, {}, {}] } as never;

  it("rounds to the nearest whole percent", () => {
    // 1/4 = 25%, 2/4 = 50%, 3/4 = 75%
    expect(modulePercent(fourSections, 1)).toBe(25);
    expect(modulePercent(fourSections, 2)).toBe(50);
    expect(modulePercent(fourSections, 3)).toBe(75);
  });

  it("caps at 100 for over-completion", () => {
    expect(modulePercent(fourSections, 9)).toBe(Math.round((9 / 4) * 100));
  });

  it("returns 0 for empty or unknown modules", () => {
    expect(modulePercent({ sections: [] } as never, 2)).toBe(0);
    expect(modulePercent(undefined, 2)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* formatPrice                                                         */
/* ------------------------------------------------------------------ */

describe("formatPrice", () => {
  it("shows Free regardless of the stored amount", () => {
    expect(formatPrice(0, true)).toBe("Free");
    expect(formatPrice(2900, true)).toBe("Free");
  });

  it("renders whole dollars for paid modules", () => {
    expect(formatPrice(2900, false)).toBe("$29");
    expect(formatPrice(4900, false)).toBe("$49");
  });

  it("rounds fractional cents up consistently", () => {
    expect(formatPrice(2950, false)).toBe("$30");
  });
});

/* ------------------------------------------------------------------ */
/* Booking slots + date validation                                     */
/* ------------------------------------------------------------------ */

describe("BOOKING_SLOTS", () => {
  it("contains only valid half-hour times", () => {
    for (const slot of BOOKING_SLOTS) {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
      const [h, m] = slot.split(":").map(Number);
      expect(h).toBeLessThanOrEqual(23);
      expect([0, 30]).toContain(m);
    }
  });

  it("excludes the lunch gap (12:00–12:30)", () => {
    expect(BOOKING_SLOTS).not.toContain("12:00");
    expect(BOOKING_SLOTS).not.toContain("12:30");
  });
});

describe("isValidBookingDate", () => {
  it("accepts strict YYYY-MM-DD dates", () => {
    expect(isValidBookingDate("2026-09-11")).toBe(true);
    expect(isValidBookingDate("2030-01-01")).toBe(true);
  });

  it("rejects wrong shapes", () => {
    expect(isValidBookingDate("11-09-2026")).toBe(false);
    expect(isValidBookingDate("2026/09/11")).toBe(false);
    expect(isValidBookingDate("")).toBe(false);
    expect(isValidBookingDate("2026-9-11")).toBe(false);
  });

  it("rejects impossible dates", () => {
    // ISO 8601 parsing treats out-of-range components as invalid, so the
    // validator rejects them instead of rolling over to a different date.
    expect(isValidBookingDate("2026-13-01")).toBe(false);
    expect(isValidBookingDate("2026-02-31")).toBe(false);
  });
});

describe("isBookableSlot", () => {
  it("accepts every declared slot", () => {
    for (const slot of BOOKING_SLOTS) {
      expect(isBookableSlot(slot)).toBe(true);
    }
  });

  it("rejects arbitrary times", () => {
    expect(isBookableSlot("09:15")).toBe(false);
    expect(isBookableSlot("12:00")).toBe(false);
    expect(isBookableSlot("")).toBe(false);
    expect(isBookableSlot("24:00")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* isValidEmail                                                        */
/* ------------------------------------------------------------------ */

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("student@example.com")).toBe(true);
    expect(isValidEmail("  padded@example.com  ")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);
    expect(isValidEmail("@nope.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
