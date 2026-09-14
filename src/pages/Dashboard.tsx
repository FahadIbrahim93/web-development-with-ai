/**
 * Dashboard — the learner's home base: interactive-lesson progress, owned
 * modules, upcoming sessions, and shortcuts into everything else.
 */
import { Award,
  BookOpen,
  CalendarClock,
  ShoppingCart,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getContentFor } from "@/convex/moduleContent";
import { formatPrice, modulePercent } from "@/lib/courseRules";
import { LESSON_ID, LESSON_STEP_TITLES as STEP_TITLES } from "@/lib/lessonMeta";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { SiteHeader } from "@/components/SiteHeader";
import { NbBox, NbRouterLink, NbSection, NbTag } from "@/components/nb";
import { cn } from "@/lib/utils";

function prettyDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  usePageTitle("Your dashboard");
  const { user } = useAuth();
  const progress = useQuery(api.progress.getLessonProgress, { lessonId: LESSON_ID });
  const orders = useQuery(api.catalog.listMyOrders, {});
  const bookings = useQuery(api.bookings.listMyBookings, {});
  const allLessons = useQuery(api.catalog.listLessons, {});
  const moduleProgressRows = useQuery(api.moduleProgress.listMyModuleProgress, {});

  const lessonTitles = new Map(
    (allLessons ?? []).map((l) => [l.slug, l.title] as const),
  );
  // slug -> % complete, from server-synced per-module progress
  const modulePct = new Map(
    (moduleProgressRows ?? []).map((row) => [
      row.moduleSlug,
      modulePercent(getContentFor(row.moduleSlug), row.doneSections.length),
    ] as const),
  );

  const cancelBooking = useMutation(api.bookings.cancelBooking);

  const completedCount = progress?.completedSteps?.length ?? 0;
  const lessonDone = completedCount >= 4;
  const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
  const upcoming = (bookings ?? [])
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/dashboard" />
      <NbSection className="py-10">
        <NbTag className="bg-accent">Learner dashboard</NbTag>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          Welcome{user?.name ? `, ${user.name}` : " back"}
        </h1>

        {/* Top grid: lesson + bookings */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Free lesson progress */}
          <NbBox className="nb-shadow-lg bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="nb-border flex size-10 items-center justify-center bg-accent">
                  <BookOpen className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold uppercase leading-tight">
                    Free interactive lesson
                  </h2>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    4 steps · ~15 min
                  </p>
                </div>
              </div>
              <NbRouterLink
                to="/lesson"
                variant={lessonDone ? "ghost" : "accent"}
                className="shrink-0 text-xs"
              >
                {lessonDone ? "Replay" : completedCount > 0 ? "Continue" : "Start"}
              </NbRouterLink>
            </div>
            <div className="mt-4 space-y-1.5">
              {STEP_TITLES.map((t, i) => {
                const done = progress?.completedSteps?.includes(i) ?? false;
                return (
                  <div
                    key={t}
                    className={cn(
                      "nb-border flex items-center gap-2 px-2.5 py-1.5 text-sm",
                      done ? "bg-[var(--chart-2)]" : "bg-background",
                    )}
                  >
                    <span className="font-mono text-xs font-bold">
                      {done ? "✓" : i + 1}
                    </span>
                    {t}
                  </div>
                );
              })}
            </div>
            {lessonDone && (
              <NbRouterLink
                to="/certificate"
                className="nb-border nb-press mt-4 flex items-center justify-between gap-2 bg-accent px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="size-4" />
                  <span className="text-sm font-bold uppercase">
                    Certificate earned — view & print
                  </span>
                </span>
                <Award className="size-4" />
              </NbRouterLink>
            )}
          </NbBox>

          {/* Upcoming sessions */}
          <NbBox className="nb-shadow-lg bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="nb-border flex size-10 items-center justify-center bg-[var(--chart-3)]">
                  <CalendarClock className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold uppercase leading-tight">Your sessions</h2>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    1:1 with your instructor
                  </p>
                </div>
              </div>
              <NbRouterLink to="/catalog" variant="ghost" className="shrink-0 text-xs">
                Book more
              </NbRouterLink>
            </div>
            <div className="mt-4 space-y-2">
              {bookings === undefined ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sessions booked yet. Pick any module and choose "book a
                  live session."
                </p>
              ) : (
                upcoming.slice(0, 4).map((b) => (
                  <div
                    key={b._id}
                    className="nb-border flex items-center justify-between bg-background px-2.5 py-2 text-sm"
                  >
                    <span>
                      <strong>{prettyDate(b.date)}</strong> · {b.time} ·{" "}
                      {lessonTitles.get(b.lessonSlug) ?? b.lessonSlug}
                    </span>
                    <button
                      onClick={() => void cancelBooking({ bookingId: b._id })}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground underline hover:text-destructive"
                    >
                      Cancel
                    </button>
                  </div>
                ))
              )}
            </div>
          </NbBox>
        </div>

        {/* Owned modules */}
        <h2 className="mt-10 text-xl font-bold uppercase tracking-tight">
          Your modules
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NbRouterLink
            to="/catalog"
            variant="ghost"
            className="flex flex-col items-start justify-center gap-2 p-5"
          >
            <Sparkles className="size-5" />
            <p className="text-sm font-bold uppercase">Browse the catalog</p>
            <p className="text-xs text-muted-foreground">
              Free and paid modules, searchable.
            </p>
          </NbRouterLink>
          {/* While the order query is in flight, stay neutral — flashing
              "No purchases yet" at someone who owns three modules reads as
              data loss. */}
          {orders === undefined ? (
            <NbBox className="bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Loading your modules…
              </p>
            </NbBox>
          ) : paidOrders.length === 0 ? (
            <>
              {/* Recommended next module — the natural next step after the free lesson */}
              {(() => {
                const ownedSlugs = new Set(paidOrders.map((o) => o.lessonSlug));
                const recommendation = (allLessons ?? [])
                  .filter((l) => !l.isFree && !ownedSlugs.has(l.slug))
                  .sort((a, b) => a.order - b.order)[0];
                if (!recommendation) return null;
                return (
                  <NbRouterLink
                    to={`/catalog/${recommendation.slug}`}
                    className="flex flex-col p-5"
                  >
                    <NbTag className="self-start bg-[var(--chart-4)]">
                      Recommended next
                    </NbTag>
                    <p className="mt-2 text-sm font-bold uppercase leading-tight">
                      {recommendation.title}
                    </p>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {recommendation.tagline}
                    </p>
                    <p className="mt-2 font-mono text-xs font-bold">
                      {formatPrice(recommendation.priceCents ?? 0, false)} · one-time
                    </p>
                  </NbRouterLink>
                );
              })()}
              <NbBox className="bg-card p-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  <p className="text-sm font-bold uppercase">No purchases yet</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Modules you buy appear here with lifetime access. Checkout is
                  currently in demo mode — nothing is charged.
                </p>
              </NbBox>
            </>
          ) : (
            paidOrders.map((o) => {
              const pct = modulePct.get(o.lessonSlug) ?? 0;
              return (
                <NbRouterLink
                  key={o._id}
                  to={`/learn/${o.lessonSlug}`}
                  className="flex flex-col p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <NbTag className={pct >= 100 ? "bg-[var(--chart-2)]" : "bg-[var(--chart-2)] self-start"}>
                      {pct >= 100 ? "Complete ✓" : "Owned"}
                    </NbTag>
                    <span className="font-mono text-xs font-bold">{pct}%</span>
                  </div>
                  <div className="nb-border mt-2 h-2.5 w-full bg-background">
                    <div
                      className="h-full bg-[var(--chart-3)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold uppercase leading-tight">
                    {lessonTitles.get(o.lessonSlug) ?? o.lessonSlug}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {pct >= 100 ? "Revisit any section →" : "Continue the course →"}
                  </p>
                </NbRouterLink>
              );
            })
          )}
        </div>
      </NbSection>
    </div>
  );
}
