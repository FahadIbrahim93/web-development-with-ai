import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Only for the very first admin — flips your own account to admin while no admin exists. */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in first.");
    const anyAdmin = await ctx.db
      .query("users")
      .withIndex("by_admin", (q) => q.eq("isAdmin", true))
      .first();
    if (anyAdmin) throw new Error("An admin already exists.");
    await ctx.db.patch(userId, { isAdmin: true });
  },
});

export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { isAdmin: false, signedIn: false };
    const user = await ctx.db.get(userId);
    return { isAdmin: user?.isAdmin ?? false, signedIn: true };
  },
});

export const listPendingPosts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    return await ctx.db
      .query("showcase")
      .withIndex("by_approved", (q) => q.eq("approved", false))
      .collect();
  },
});

export const listAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    const orders = await ctx.db.query("orders").collect();
    // Point-read the buyer per row instead of scanning every user into a
    // Map — O(1) per order, and cost grows with orders shown, not users.
    const withBuyer = await Promise.all(
      orders.map(async (o) => {
        const u = await ctx.db.get(o.userId);
        return {
          ...o,
          buyerName: u?.name ?? null,
          buyerEmail: u?.email ?? null,
        };
      }),
    );
    return withBuyer;
  },
});

export const listAllLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    return await ctx.db.query("lessons").collect();
  },
});

/** Waitlist with signup dates (admin only). */
export const listWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) return [];
    return await ctx.db.query("waitlist").collect();
  },
});

export const moderatePost = mutation({
  args: { postId: v.id("showcase"), approve: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) throw new Error("Admins only.");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");
    if (args.approve) {
      await ctx.db.patch(args.postId, { approved: true });
    } else {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();
      for (const c of comments) await ctx.db.delete(c._id);
      await ctx.db.delete(args.postId);
    }
  },
});

export const upsertLesson = mutation({
  args: {
    id: v.optional(v.id("lessons")),
    slug: v.string(),
    title: v.string(),
    tagline: v.string(),
    description: v.string(),
    level: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    priceCents: v.number(),
    isFree: v.boolean(),
    isPublished: v.boolean(),
    minutes: v.number(),
    topics: v.array(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) throw new Error("Admins only.");
    const { id, ...fields } = args;
    if (id) {
      await ctx.db.patch(id, fields);
      return id;
    }
    return await ctx.db.insert("lessons", fields);
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) throw new Error("Admins only.");
    await ctx.db.delete(args.id);
  },
});

export const publishLesson = mutation({
  args: { id: v.id("lessons"), isPublished: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) throw new Error("Admins only.");
    await ctx.db.patch(args.id, { isPublished: args.isPublished });
  },
});

/** Owner updates a booking's status (cancel a session, mark it completed). */
export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const me = userId ? await ctx.db.get(userId) : null;
    if (!me?.isAdmin) throw new Error("Admins only.");
    await ctx.db.patch(args.bookingId, { status: args.status });
  },
});
