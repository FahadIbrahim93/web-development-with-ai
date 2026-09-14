/**
 * Simple sliding-window rate limiting for public write mutations.
 *
 * Every enforced call reads (or creates) the counter document for
 * (name, key) and increments it. Two concurrent mutations touching the
 * same document are serialized by Convex OCC, so counts cannot race.
 * Expired counters are garbage-collected by a detached scheduled mutation
 * so the table never grows without bound.
 *
 * Not a WAF — this stops casual spam and runaway clients, not determined
 * attackers. Convex's own auth endpoints do their additional throttling.
 */
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

export const RATE_LIMITS = {
  // Convex mutations cannot read request IPs, so anonymous writes (waitlist)
  // key on the submitted value; signed-in writes key on the user id.
  waitlist: { max: 5, windowMs: 60 * 60 * 1000 }, // 5/hour per email
  comment: { max: 10, windowMs: 10 * 60 * 1000 }, // 10/10min per user
  post: { max: 3, windowMs: 60 * 60 * 1000 }, // 3/hour per user
  booking: { max: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5/day per user
  checkout: { max: 10, windowMs: 60 * 60 * 1000 }, // 10/hour per user
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * Throws when the caller exceeds the limit for `name`. `key` identifies the
 * caller — a user id when signed in, an IP-ish string when anonymous.
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  name: RateLimitName,
  key: string,
): Promise<void> {
  const { max, windowMs } = RATE_LIMITS[name];
  const now = Date.now();

  const doc = await ctx.db
    .query("rateLimits")
    .withIndex("by_name_key", (q) => q.eq("name", name).eq("key", key))
    .unique();

  let count = 1;
  let windowStart = now;
  if (doc && now - doc.windowStart < windowMs) {
    if (doc.count >= max) {
      throw new Error(
        "You're doing that too often — please try again a bit later.",
      );
    }
    count = doc.count + 1;
    windowStart = doc.windowStart;
  }

  if (doc) {
    await ctx.db.patch(doc._id, { count, windowStart });
  } else {
    await ctx.db.insert("rateLimits", { name, key, count, windowStart });
  }

  // Detached GC: drop the counter after the window closes. Scheduling from
  // the enforcing mutation keeps the table self-cleaning with zero cron.
  await ctx.scheduler.runAfter(windowMs + 60_000, internal.rateLimit.cleanup, {
    name,
    key,
  });
}

/** Delete the counter for (name, key) if its window has fully elapsed. */
export const cleanup = internalMutation({
  args: { name: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    const limits = RATE_LIMITS[args.name as RateLimitName];
    if (!limits) return;
    const doc = await ctx.db
      .query("rateLimits")
      .withIndex("by_name_key", (q) =>
        q.eq("name", args.name).eq("key", args.key),
      )
      .unique();
    if (doc && Date.now() - doc.windowStart >= limits.windowMs) {
      await ctx.db.delete(doc._id);
    }
  },
});

/** Caller key for a signed-in rate limit — the user id. */
export async function userRateLimitKey(ctx: MutationCtx): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in first.");
  return userId;
}

/** Caller key for an anonymous write keyed on a submitted value (email). */
export async function valueRateLimitKey(value: string): Promise<string> {
  return value.trim().toLowerCase();
}
