import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

/**
 * The cached public snapshot for the landing widget and admin card.
 * Returns null while unconfigured or before the first successful refresh —
 * callers then hide their widgets. Lives here (not in github.ts) because
 * "use node" files may only export actions.
 */
export const repoSnapshot = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("githubCache")
      .withIndex("by_singleton", (q) => q.eq("id", "singleton"))
      .unique();
  },
});

/**
 * Read the cached snapshot (or null before the first refresh). Internal:
 * the refresh action has no direct db access, so it checks freshness and
 * the public query reads through this.
 */
export const getSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("githubCache")
      .withIndex("by_singleton", (q) => q.eq("id", "singleton"))
      .unique();
  },
});

/**
 * Upsert the single githubCache row with a freshly fetched snapshot.
 * Internal-only: written by the GitHub refresh action, read by queries.
 */
export const store = internalMutation({
  args: {
    repo: v.string(),
    stars: v.number(),
    forks: v.number(),
    openIssues: v.number(),
    defaultBranch: v.string(),
    pushedAt: v.number(),
    latestReleaseTag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubCache")
      .withIndex("by_singleton", (q) => q.eq("id", "singleton"))
      .unique();
    const row = { ...args, id: "singleton" as const, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.replace(existing._id, row);
    } else {
      await ctx.db.insert("githubCache", row);
    }
  },
});
