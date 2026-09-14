import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LESSON_ID } from "../lib/lessonMeta";

/**
 * Persist the signed-in learner's free-lesson progress. `lessonId` is
 * validated against the shared LESSON_ID so stray keys can never grow the
 * progress table — the free lesson is the only lesson that tracks steps.
 */
export const getLessonProgress = query({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    if (args.lessonId !== LESSON_ID) return null;

    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const doc = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();
    return doc ?? null;
  },
});

export const saveLessonProgress = mutation({
  args: {
    lessonId: v.string(),
    step: v.number(),
    completedSteps: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const doc = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q) =>
        q.eq("userId", userId).eq("lessonId", args.lessonId),
      )
      .unique();

    if (doc) {
      await ctx.db.patch(doc._id, {
        step: args.step,
        completedSteps: args.completedSteps,
        updatedAt: Date.now(),
      });
      return doc._id;
    }

    return await ctx.db.insert("lessonProgress", {
      userId,
      lessonId: args.lessonId,
      step: args.step,
      completedSteps: args.completedSteps,
      updatedAt: Date.now(),
    });
  },
});
