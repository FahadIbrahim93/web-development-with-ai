/**
 * Pure domain rules shared by the React frontend and the Convex backend.
 *
 * Every function here is side-effect-free and dependency-free on purpose:
 * these are the invariants of the product, so they live in one place and are
 * covered by unit tests (see src/lib/courseRules.test.ts). Convex functions
 * import this file with a relative path; the frontend uses the "@/lib" alias.
 */

import type { ModuleContent } from "../convex/moduleContent";

/* ------------------------------------------------------------------ */
/* Module completion                                                   */
/* ------------------------------------------------------------------ */

/**
 * A module is complete when every section has been marked done — the same
 * rule the course player uses for its finish screen. Any consumer (catalog
 * badges, dashboard, certificates) must go through this function so the
 * definition can never drift between screens.
 */
export function isModuleComplete(
  content: Pick<ModuleContent, "sections"> | undefined,
  doneCount: number,
): boolean {
  const total = content?.sections.length ?? 0;
  return total > 0 && doneCount >= total;
}

/** Percentage (0–100) of a module's sections marked done. */
export function modulePercent(
  content: Pick<ModuleContent, "sections"> | undefined,
  doneCount: number,
): number {
  const total = content?.sections.length ?? 0;
  return total > 0 ? Math.round((doneCount / total) * 100) : 0;
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

/** Catalog price display: "Free" for free modules, whole dollars otherwise. */
export function formatPrice(priceCents: number, isFree: boolean): string {
  if (isFree) return "Free";
  return `$${Math.round(priceCents / 100)}`;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                            */
/* ------------------------------------------------------------------ */

/** Bookable half-hour slots (24h local time). Shared with the booking UI. */
export const BOOKING_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
] as const;

export type BookableSlot = (typeof BOOKING_SLOTS)[number];

/**
 * Strict YYYY-MM-DD calendar date. Beyond shape and range, the day must
 * actually exist in that month — JS's Date would otherwise silently roll
 * "2026-02-31" over to March 3rd and book a session on a date the student
 * never picked.
 */
export function isValidBookingDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  // Day 0 of month index m = the last day of human month m (m is 1-based here).
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
}

/** Whether `time` is one of the bookable half-hour slots. */
export function isBookableSlot(time: string): time is BookableSlot {
  return (BOOKING_SLOTS as readonly string[]).includes(time);
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

/** Minimal but honest email shape check (used by waitlist + auth UI copy). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
