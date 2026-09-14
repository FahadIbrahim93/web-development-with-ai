import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { enforceRateLimit, userRateLimitKey } from "./rateLimit";
import { isValidBookingDate, isBookableSlot } from "../lib/courseRules";

/** Server-side pretty date (timezone-optional) for email copy. */
function prettyDate(iso: string, timeZone?: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
}

export const listMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listAllBookings = query({
  args: {},
  handler: async (ctx) => {
    // Admins only — bookings include the student's private note.
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    return await ctx.db.query("bookings").collect();
  },
});

/** All bookings joined with the student's name + email (admin only). */
export const listAllBookingsWithUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    const bookings = await ctx.db.query("bookings").collect();
    // Point-read the student per row instead of scanning every user.
    const withStudent = await Promise.all(
      bookings.map(async (b) => {
        const u = await ctx.db.get(b.userId);
        return {
          ...b,
          studentName: u?.name ?? null,
          studentEmail: u?.email ?? null,
      };
      }),
    );
    return withStudent;
  },
});

/** Slots are half-hour blocks between 09:00 and 17:30. */
export const listTakenSlots = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    return all
      .filter((b) => b.status === "confirmed")
      .map((b) => b.time);
  },
});

export const createBooking = mutation({
  args: {
    lessonSlug: v.string(),
    date: v.string(),
    time: v.string(),
    timezone: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to book a session.");

    // Strict server-side validation — the UI is not the source of truth.
    if (!isValidBookingDate(args.date)) throw new Error("Invalid date.");
    if (!isBookableSlot(args.time)) {
      throw new Error("Invalid time slot.");
    }
    if (args.note && args.note.length > 500) {
      throw new Error("Please keep the note under 500 characters.");
    }
    await enforceRateLimit(ctx, "booking", await userRateLimitKey(ctx));

    // Atomic double-booking guard. Concurrent mutations that touch the same
    // bookingLocks row are serialized by Convex OCC: the loser retries, sees
    // the lock, and fails with a friendly error instead of double-booking.
    const lock = await ctx.db
      .query("bookingLocks")
      .withIndex("by_date_time", (q) =>
        q.eq("date", args.date).eq("time", args.time),
      )
      .unique();
    if (lock) throw new Error("That slot was just taken — pick another.");

    const bookingId = await ctx.db.insert("bookings", {
      userId,
      lessonSlug: args.lessonSlug,
      date: args.date,
      time: args.time,
      timezone: args.timezone,
      note: args.note,
      status: "confirmed",
      createdAt: Date.now(),
    });

    // Claim the slot. Written after the booking so a losing concurrent
    // transaction re-runs the lock check above on OCC retry.
    await ctx.db.insert("bookingLocks", { date: args.date, time: args.time });

    // Confirmation email — detached, never blocks or fails the booking.
    await ctx.scheduler.runAfter(0, internal.bookings.sendBookingConfirmation, {
      bookingId,
    });

    // Heads-up for the course owner (dormant without OWNER_EMAIL + key).
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_slug", (q) => q.eq("slug", args.lessonSlug))
      .unique();
    await ctx.scheduler.runAfter(0, internal.emails.notifyOwner, {
      subject: `New session booking — ${prettyDate(args.date, args.timezone)} ${args.time}`,
      text: [
        `New 1:1 booking:`,
        ``,
        `Module: ${lesson?.title ?? args.lessonSlug}`,
        `When: ${prettyDate(args.date, args.timezone)} at ${args.time}${args.timezone ? ` (${args.timezone})` : ""}`,
        args.note ? `Note: "${args.note}"` : ``,
        ``,
        `Manage it in the admin area → Sessions tab.`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
    });

    return bookingId;
  },
});

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.userId !== userId) throw new Error("Booking not found.");
    await ctx.db.patch(args.bookingId, { status: "cancelled" });

    // Free the slot again: drop its lock so someone else can book it.
    const lock = await ctx.db
      .query("bookingLocks")
      .withIndex("by_date_time", (q) =>
        q.eq("date", booking.date).eq("time", booking.time),
      )
      .unique();
    if (lock) await ctx.db.delete(lock._id);
  },
});

/**
 * After a booking is confirmed, queue a confirmation email (no-op unless an
 * email API key is configured). Runs detached so the UI never waits on it.
 */
export const sendBookingConfirmation = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;
    const user = await ctx.db.get(booking.userId);
    const email = user?.email;
    if (!email) return;
    const pretty = new Date(booking.date + "T00:00:00").toLocaleDateString(
      "en-US",
      { weekday: "long", month: "long", day: "numeric", timeZone: booking.timezone || undefined },
    );
    await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
      to: email,
      subject: `Your session is booked — ${pretty} at ${booking.time}`,
      text: [
        `Hi${user?.name ? ` ${user.name}` : ""},`,
        ``,
        `Your 1:1 session is confirmed for ${pretty} at ${booking.time}${booking.timezone ? ` (${booking.timezone})` : ""} (30 minutes).`,
        ``,
        booking.note ? `You mentioned: "${booking.note}"` : ``,
        ``,
        `A video-call link arrives before we meet. Bring questions and your`,
        `current progress — see you then!`,
        ``,
        `— Web Development with AI`,
      ]
        .filter((l) => l !== ``)
        .join("\n"),
    });
  },
});
