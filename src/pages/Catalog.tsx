/**
 * Catalog — browse and search every course module. Filter by level, search
 * by keyword, sort by price or length. Free modules are clearly marked.
 */
import { useEffect, useMemo, useState } from "react";
import { Award, Search } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getContentFor } from "@/convex/moduleContent";
import { formatPrice, isModuleComplete } from "@/lib/courseRules";
import { SiteHeader } from "@/components/SiteHeader";
import { usePageTitle } from "@/hooks/use-page-title";
import { NbBox, NbRouterLink, NbSection, NbTag } from "@/components/nb";
import { cn } from "@/lib/utils";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_COLORS: Record<Level, string> = {
  beginner: "bg-[var(--chart-2)]",
  intermediate: "bg-accent",
  advanced: "bg-[var(--chart-3)]",
};

export default function Catalog() {
  usePageTitle("Course catalog");
  const lessons = useQuery(api.catalog.listLessons, {});
  const moduleProgressRows = useQuery(api.moduleProgress.listMyModuleProgress, {});
  const seedCatalog = useMutation(api.seed.seedCatalog);

  // Modules the learner has fully finished — the shared completion rule
  // (src/lib/courseRules.ts), the same one the player and dashboard use.
  const completedSlugs = useMemo(() => {
    const done = new Set<string>();
    for (const row of moduleProgressRows ?? []) {
      if (isModuleComplete(getContentFor(row.moduleSlug), row.doneSections.length)) {
        done.add(row.moduleSlug);
      }
    }
    return done;
  }, [moduleProgressRows]);

  // First visit: fill the catalog with starter modules (no-op afterwards).
  useEffect(() => {
    if (lessons !== undefined && lessons.length === 0) {
      void seedCatalog({});
    }
  }, [lessons, seedCatalog]);

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [sort, setSort] = useState<"order" | "price-asc" | "price-desc" | "minutes">("order");

  const filtered = useMemo(() => {
    let items = lessons ?? [];
    if (level !== "all") items = items.filter((l) => l.level === level);
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.tagline.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.topics.some((t) => t.toLowerCase().includes(q)),
      );
    }
    const sorted = [...items];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "price-desc") sorted.sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "minutes") sorted.sort((a, b) => a.minutes - b.minutes);
    if (sort === "order") sorted.sort((a, b) => a.order - b.order);
    return sorted;
  }, [lessons, search, level, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/catalog" />
      <NbSection className="py-10">
        <NbTag className="bg-accent">Course catalog</NbTag>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Learn at your own pace
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every module is project-based and made for people who don't write
          code. Start free, then pick up exactly what you need.
        </p>

        {/* Search + filters */}
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules — e.g. publishing, images, booking…"
              className="nb-border w-full bg-card px-9 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-[var(--chart-3)]"
              aria-label="Search catalog"
            />
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Level | "all")}
            className="nb-border bg-card px-3 py-2.5 text-sm font-bold uppercase tracking-wide outline-none"
            aria-label="Filter by level"
          >
            <option value="all">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="nb-border bg-card px-3 py-2.5 text-sm font-bold uppercase tracking-wide outline-none"
            aria-label="Sort"
          >
            <option value="order">Sort: recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="minutes">Shortest first</option>
          </select>
        </div>

        {/* Cards */}
        {!lessons ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <NbBox className="mt-8 bg-card p-8 text-center">
            <p className="font-bold uppercase">No modules match that search</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a broader term, or clear the level filter.
            </p>
          </NbBox>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <NbRouterLink
                key={l._id}
                to={`/catalog/${l.slug}`}
                className="nb-shadow flex flex-col p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <NbTag className={cn(LEVEL_COLORS[l.level])}>{l.level}</NbTag>
                    {completedSlugs.has(l.slug) && (
                      <NbTag className="inline-flex items-center gap-1 bg-[var(--chart-2)]">
                        <Award className="size-3" aria-hidden="true" />
                        Completed
                      </NbTag>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {l.isFree ? "FREE" : formatPrice(l.priceCents, l.isFree)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-bold uppercase leading-tight">
                  {l.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {l.tagline}
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {l.minutes} min · {l.topics.length} topics
                </p>
              </NbRouterLink>
            ))}
          </div>
        )}
      </NbSection>
    </div>
  );
}
