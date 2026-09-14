import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const levelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
);

const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("cancelled"),
);

const bookingStatusValidator = v.union(
  v.literal("confirmed"),
  v.literal("cancelled"),
);

const schema = defineSchema(
  {
    // one row per (rate-limit name, key) — sliding-window request throttling
    rateLimits: defineTable({
      name: v.string(),
      key: v.string(),
      count: v.number(),
      windowStart: v.number(),
    }).index("by_name_key", ["name", "key"]),

    // one row per (date, time) slot that has EVER been booked — read+inserted
    // by createBooking so concurrent mutations contend on the same document
    // and Convex OCC serializes them (no double-booking race).
    bookingLocks: defineTable({
      date: v.string(),
      time: v.string(),
    }).index("by_date_time", ["date", "time"]),

    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      isAdmin: v.optional(v.boolean()),
    })
      .index("email", ["email"])
      .index("by_admin", ["isAdmin"]),

    // lesson progress for the interactive lesson
    lessonProgress: defineTable({
      userId: v.id("users"),
      lessonId: v.string(),
      step: v.number(),
      completedSteps: v.array(v.number()),
      updatedAt: v.number(),
    })
      .index("by_user_lesson", ["userId", "lessonId"])
      .index("by_lesson", ["lessonId"]),

    // per-module course progress (done + solved sections), device-synced
    moduleProgress: defineTable({
      userId: v.id("users"),
      moduleSlug: v.string(),
      doneSections: v.array(v.number()),
      solvedSections: v.array(v.number()),
      updatedAt: v.number(),
    }).index("by_user_module", ["userId", "moduleSlug"]),

    // purchasable catalog of course modules
    lessons: defineTable({
      slug: v.string(),
      title: v.string(),
      tagline: v.string(),
      description: v.string(),
      level: levelValidator,
      priceCents: v.number(),
      isFree: v.boolean(),
      isPublished: v.boolean(),
      minutes: v.number(),
      topics: v.array(v.string()),
      order: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_published", ["isPublished"])
      .index("by_status", ["isPublished", "order"]),

    // one-time purchases
    orders: defineTable({
      userId: v.id("users"),
      lessonSlug: v.string(),
      amountCents: v.number(),
      status: orderStatusValidator,
      provider: v.optional(v.string()), // "demo" | "stripe"
      stripeSessionId: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // 1:1 mentor session bookings
    bookings: defineTable({
      userId: v.id("users"),
      lessonSlug: v.string(),
      date: v.string(), // YYYY-MM-DD
      time: v.string(), // HH:MM (24h) in the student's timezone
      timezone: v.optional(v.string()), // e.g. "Europe/Berlin"
      note: v.optional(v.string()),
      status: bookingStatusValidator,
      createdAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_date", ["date"]),

    // student builds
    showcase: defineTable({
      userId: v.id("users"),
      authorName: v.optional(v.string()),
      title: v.string(),
      url: v.optional(v.string()),
      description: v.string(),
      approved: v.boolean(),
      createdAt: v.number(),
    }).index("by_approved", ["approved"]),

    // comments on showcase posts
    comments: defineTable({
      postId: v.id("showcase"),
      userId: v.id("users"),
      authorName: v.optional(v.string()),
      body: v.string(),
      createdAt: v.number(),
    }).index("by_post", ["postId"]),

    // pre-launch email capture
    waitlist: defineTable({
      email: v.string(),
      createdAt: v.number(),
    }).index("by_email", ["email"]),

    // Cached snapshot of the public GitHub repo powering the "Built in the
    // open" landing widget and the admin repo-health card. A single fixed
    // row ("singleton") refreshed by a background action — reads never hit
    // the network, so the landing page stays fast and rate-limit-proof.
    githubCache: defineTable({
      id: v.literal("singleton"),
      repo: v.string(),
      stars: v.number(),
      forks: v.number(),
      openIssues: v.number(),
      defaultBranch: v.string(),
      pushedAt: v.number(),
      latestReleaseTag: v.optional(v.string()),
      fetchedAt: v.number(),
    }).index("by_singleton", ["id"]),
  },
  {
    // Full validation catches drift between handlers and schema at deploy
    // time — with it off, a renamed field silently stores dead data.
    schemaValidation: true,
  },
);

export default schema;
