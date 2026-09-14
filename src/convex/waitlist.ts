import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforceRateLimit, valueRateLimitKey } from "./rateLimit";
import { isValidEmail } from "../lib/courseRules";

/** Join the pre-launch waitlist. Idempotent per email. */
export const joinWaitlist = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("That doesn't look like an email address.");
    }
    await enforceRateLimit(ctx, "waitlist", await valueRateLimitKey(email));
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { alreadyJoined: true as const };

    await ctx.db.insert("waitlist", { email, createdAt: Date.now() });
    return { alreadyJoined: false as const };
  },
});

/**
 * Public: signup timestamps only. The array shape keeps the landing page's
 * `.length` social proof working, while ensuring no personal data (emails)
 * ever leaves the server for anonymous callers.
 */
export const countWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("waitlist").collect();
    return rows.map((r) => r.createdAt);
  },
});

/** Admin only: full list with emails + signup dates. */
export const listWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    return await ctx.db.query("waitlist").collect();
  },
});
