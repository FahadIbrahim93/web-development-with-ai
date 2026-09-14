import { mutation } from "./_generated/server";

const SEED_LESSONS = [
  {
    slug: "foundations",
    title: "Web Foundations, Explained Simply",
    tagline: "What a website actually is — browsers, servers, and files.",
    description:
      "Start from zero. Using a friendly café analogy, you'll learn what happens when you type an address and press Enter, what a website is made of, and where AI fits into the picture. Ends with you building your very first page interactively.",
    level: "beginner" as const,
    priceCents: 0,
    isFree: true,
    isPublished: true,
    minutes: 15,
    topics: ["HTML basics", "How the web works", "AI-assisted building"],
    order: 1,
  },
  {
    slug: "first-site",
    title: "Your First Real Website",
    tagline: "Go from a wish list to a polished one-page site.",
    description:
      "Turn an idea into a finished one-page site: structure, colors, and copy that sounds like you. You'll practice describing what you want in plain language, reviewing what AI produces, and iterating until it feels right.",
    level: "beginner" as const,
    priceCents: 2900,
    isFree: false,
    isPublished: true,
    minutes: 45,
    topics: ["Page structure", "Design basics", "Prompting"],
    order: 2,
  },
  {
    slug: "content-that-converts",
    title: "Words and Pictures That Work",
    tagline: "Write copy and choose images that make your site feel professional.",
    description:
      "A site is only as good as what's on it. Learn to draft headlines, write about pages people actually read, and pick images that match your brand — with AI as your drafting partner and you as the editor-in-chief.",
    level: "beginner" as const,
    priceCents: 2900,
    isFree: false,
    isPublished: true,
    minutes: 40,
    topics: ["Copywriting", "Imagery", "Editing AI drafts"],
    order: 3,
  },
  {
    slug: "going-live",
    title: "Going Live: Publish Your Site",
    tagline: "Get a real address on the internet, step by step.",
    description:
      "Take your finished site from your laptop to the world. We cover choosing a domain, publishing, and the small checks that make a big difference — how it looks on phones, how fast it loads, and how people find you.",
    level: "intermediate" as const,
    priceCents: 4900,
    isFree: false,
    isPublished: true,
    minutes: 50,
    topics: ["Domains", "Publishing", "Mobile checks"],
    order: 4,
  },
  {
    slug: "site-that-sells",
    title: "A Site That Sells For You",
    tagline: "Turn visitors into customers with pages built to convert.",
    description:
      "Whether you sell products, services, or your own skills, this module shows you how to shape a site around action: clear offers, honest pricing pages, contact forms that get answered, and booking flows that feel effortless.",
    level: "intermediate" as const,
    priceCents: 4900,
    isFree: false,
    isPublished: true,
    minutes: 60,
    topics: ["Conversion", "Offers", "Forms & booking"],
    order: 5,
  },
  {
    slug: "maintenance",
    title: "Keep It Fresh: Maintain & Grow",
    tagline: "Small routines that keep your site healthy for years.",
    description:
      "Websites aren't one-and-done. Learn a simple monthly routine — updating content, checking links, reviewing what visitors do — and how AI can take most of the chores off your plate.",
    level: "intermediate" as const,
    priceCents: 3900,
    isFree: false,
    isPublished: true,
    minutes: 35,
    topics: ["Updates", "Analytics basics", "AI routines"],
    order: 6,
  },
];

/**
 * Idempotent: fills the catalog on first call, no-ops once any lesson exists.
 * Safe to call from the client on catalog load.
 */
export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    // Slug-level uniqueness guard: safe even if two visitors seed at once.
    const existing = await ctx.db.query("lessons").collect();
    const slugs = new Set(existing.map((l) => l.slug));
    for (const lesson of SEED_LESSONS) {
      if (slugs.has(lesson.slug)) continue;
      await ctx.db.insert("lessons", lesson);
      slugs.add(lesson.slug);
    }
  },
});
