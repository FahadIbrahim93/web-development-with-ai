import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { enforceRateLimit, userRateLimitKey } from "./rateLimit";
import { getCurrentUser } from "./users";

const MAX_TITLE = 80;
const MAX_BODY = 2000;

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("showcase")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .collect();
  },
});

export const getPost = query({
  args: { id: v.id("showcase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listComments = query({
  args: { postId: v.id("showcase") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to share your build.");
    const user = await getCurrentUser(ctx);

    const title = args.title.trim();
    const description = args.description.trim();
    if (title.length < 3 || title.length > MAX_TITLE) {
      throw new Error("Title must be 3–80 characters.");
    }
    if (description.length < 10 || description.length > MAX_BODY) {
      throw new Error("Description must be 10–2000 characters.");
    }
    const url = args.url?.trim() || undefined;
    if (url && !/^https?:\/\//.test(url)) {
      throw new Error("Link must start with http:// or https://");
    }
    await enforceRateLimit(ctx, "post", await userRateLimitKey(ctx));

    return await ctx.db.insert("showcase", {
      userId,
      authorName: user?.name ?? user?.email ?? "A student",
      title,
      description,
      url,
      approved: false,
      createdAt: Date.now(),
    });
  },
});

export const createComment = mutation({
  args: { postId: v.id("showcase"), body: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to comment.");
    const user = await getCurrentUser(ctx);

    const body = args.body.trim();
    if (body.length < 1 || body.length > 500) {
      throw new Error("Comments must be 1–500 characters.");
    }
    const post = await ctx.db.get(args.postId);
    if (!post || !post.approved) throw new Error("Post not found.");
    await enforceRateLimit(ctx, "comment", await userRateLimitKey(ctx));

    return await ctx.db.insert("comments", {
      postId: args.postId,
      userId,
      authorName: user?.name ?? user?.email ?? "A student",
      body,
      createdAt: Date.now(),
    });
  },
});

export const deleteMyComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.userId !== userId) throw new Error("Not your comment.");
    await ctx.db.delete(args.commentId);
  },
});

export const deleteMyPost = mutation({
  args: { postId: v.id("showcase") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post || post.userId !== userId) throw new Error("Not your post.");
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    await ctx.db.delete(args.postId);
  },
});
