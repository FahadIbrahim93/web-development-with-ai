import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** One row per (user, module). Returns null when signed out. */
export const getModuleProgress = query({
  args: { moduleSlug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("moduleProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleSlug", args.moduleSlug),
      )
      .unique();
  },
});

/** All progress rows for the signed-in learner (used by the dashboard). */
export const listMyModuleProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("moduleProgress")
      .withIndex("by_user_module", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Merge-save: takes the union of local (this device) and stored progress so
 * switching devices adds progress instead of losing it. Counter arrays only
 * grow; no decrement path needed for an honest "furthest so far" record.
 */
export const saveModuleProgress = mutation({
  args: {
    moduleSlug: v.string(),
    doneSections: v.array(v.number()),
    solvedSections: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return;

    const existing = await ctx.db
      .query("moduleProgress")
      .withIndex("by_user_module", (q) =>
        q.eq("userId", userId).eq("moduleSlug", args.moduleSlug),
      )
      .unique();

    const union = (a: number[], b: number[]) =>
      [...new Set([...a, ...b])].sort((x, y) => x - y);

    if (existing) {
      const nextDone = union(existing.doneSections, args.doneSections);
      const nextSolved = union(existing.solvedSections, args.solvedSections);
      if (
        nextDone.length === existing.doneSections.length &&
        nextSolved.length === existing.solvedSections.length
      ) {
        return; // nothing new — avoid a pointless write
      }
      await ctx.db.patch(existing._id, {
        doneSections: nextDone,
        solvedSections: nextSolved,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("moduleProgress", {
        userId,
        moduleSlug: args.moduleSlug,
        doneSections: [...new Set(args.doneSections)].sort((x, y) => x - y),
        solvedSections: [...new Set(args.solvedSections)].sort((x, y) => x - y),
        updatedAt: Date.now(),
      });
    }
  },
});
