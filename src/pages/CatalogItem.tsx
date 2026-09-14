/**
 * CatalogItem — the detail page for one course module. Shows the full
 * description, topics, price, and the actions: start learning (free), buy,
 * or book a live session.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { BookOpenCheck, CalendarClock, Check, ShoppingCart } from "lucide-react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { getContentFor } from "@/convex/moduleContent";
import { formatPrice } from "@/lib/courseRules";
import { NbDisclosure } from "@/components/nb";
import {
  NbBox,
  NbButton,
  NbRouterLink,
  NbSection,
  NbTag,
} from "@/components/nb";
import { SectionActivity } from "@/components/interactive/SectionActivity";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { cn } from "@/lib/utils";

export default function CatalogItem() {
  const { slug = "" } = useParams();
  usePageTitle("Module");
  const content = getContentFor(slug);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const lesson = useQuery(api.catalog.getLesson, { slug });
  const owned = useQuery(api.catalog.hasAccess, { slug });
  const startCheckout = useMutation(api.catalog.startCheckout);
  const startCheckoutAction = useAction(api.stripe.startCheckoutAction);
  const completeDemo = useMutation(api.catalog.completeDemoCheckout);

  const [checkoutState, setCheckoutState] = useState<
    "idle" | "pending" | "paid" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  // Free preview of section 1 (paid modules): track play locally so the CTA
  // can react to engagement without touching any progress store.
  const [previewSolved, setPreviewSolved] = useState(false);

  // Returning from Stripe: ?checkout=success (payment done, webhook may lag a
  // few seconds) or ?checkout=cancelled. While ownership hasn't landed yet we
  // show a "confirming…" banner; once `owned` flips true the buy card swaps
  // itself for "Start the course" — no extra state needed.
  const [searchParams, setSearchParams] = useSearchParams();
  const stripeReturn = searchParams.get("checkout");
  const waitingForConfirm = stripeReturn === "success" && !owned;

  // Give up waiting after 20s — clean the URL so the normal buy card returns
  // instead of a dead "confirming" state (e.g. webhook misconfigured).
  useEffect(() => {
    if (!stripeReturn) return;
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      setSearchParams(url.searchParams, { replace: true });
    }, 20000);
    return () => window.clearTimeout(t);
  }, [stripeReturn, setSearchParams]);

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/catalog/${slug}`)}`);
      return;
    }
    setError(null);
    try {
      const res = await startCheckout({ slug });
      if (res.alreadyOwned) {
        setCheckoutState("paid");
        return;
      }
      if (!res.orderId) throw new Error("Could not start checkout.");
      setCheckoutState("pending");
      const session = await startCheckoutAction({
        slug,
        orderId: res.orderId,
        origin: window.location.origin,
      });
      if (session.mode === "stripe" && session.url) {
        // Real Stripe checkout — redirect to the hosted payment page.
        window.location.assign(session.url);
        return;
      }
      // Demo mode (no Stripe keys yet): simulate payment locally.
      await completeDemo({ orderId: res.orderId });
      setCheckoutState("paid");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckoutState("error");
    }
  };

  const price = lesson
    ? formatPrice(lesson.priceCents, lesson.isFree)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/catalog" />
      <NbSection className="py-10">
        <Link
          to="/catalog"
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to catalog
        </Link>

        {lesson === null ? (
          <NbBox className="mt-8 bg-card p-8 text-center">
            <p className="font-bold uppercase">Module not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              It may have been renamed or unpublished.
            </p>
            <NbRouterLink to="/catalog" variant="accent" className="mt-4">
              Browse the catalog
            </NbRouterLink>
          </NbBox>
        ) : !lesson ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Main column */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <NbTag className="bg-accent">{lesson.level}</NbTag>
                <NbTag>{lesson.minutes} minutes</NbTag>
                <NbTag>{lesson.isFree ? "Free" : price}</NbTag>
              </div>
              <h1 className="mt-4 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                {lesson.title}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">{lesson.tagline}</p>

              <NbBox className="mt-6 bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  About this module
                </p>
                <p className="mt-2 leading-relaxed">{lesson.description}</p>
              </NbBox>

              <h2 className="mt-8 text-xl font-bold uppercase tracking-tight">
                What you'll cover
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {lesson.topics.map((t) => (
                  <div
                    key={t}
                    className="nb-border flex items-center gap-2 bg-card px-3 py-2 text-sm"
                  >
                    <Check className="size-4 shrink-0 text-[var(--chart-2)]" />
                    {t}
                  </div>
                ))}
              </div>

              {/* Real course-content preview — sell the teaching, not a topic list. */}
              {content && (
                <>
                  <h2 className="mt-8 text-xl font-bold uppercase tracking-tight">
                    Peek inside the course
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {content.sections.length} sections · every one ends in a
                    hands-on challenge you must solve to move on.
                  </p>
                  <div className="mt-3 space-y-2">
                    {content.sections.map((sec, i) => (
                      <NbDisclosure
                        key={sec.title}
                        title={`${i + 1}. ${sec.title}`}
                      >
                        <p className="font-medium">{sec.reading[0]}</p>
                        <p className="mt-2 text-muted-foreground">
                          <span className="font-bold text-foreground">
                            Your challenge:{" "}
                          </span>
                          {sec.activity}
                        </p>
                      </NbDisclosure>
                    ))}
                  </div>

                  {/* Free preview (paid modules): section 1 in full — reading,
                      activity, recap, and the playable challenge. Free modules
                      skip this; the whole course is already free to open. */}
                  {!lesson.isFree && (
                    <NbBox className="mt-8 bg-[var(--chart-3)] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-widest">
                          Free preview — section 1 in full
                        </p>
                        <NbTag className="bg-background">No sign-up needed</NbTag>
                      </div>
                      <h3 className="mt-3 text-lg font-bold uppercase leading-tight">
                        {content.sections[0].title}
                      </h3>
                      <div className="mt-3 space-y-2">
                        {content.sections[0].reading.map((para) => (
                          <p key={para} className="text-sm leading-relaxed">
                            {para}
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="nb-border bg-card p-3">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Your challenge
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">
                            {content.sections[0].activity}
                          </p>
                        </div>
                        <div className="nb-border bg-card p-3">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Takeaway
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">
                            {content.sections[0].recap}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-widest">
                          Try the challenge — right here
                        </p>
                        <div className="mt-2">
                          <SectionActivity
                            slug={`${slug}:preview`}
                            sectionIndex={0}
                            interactive={content.sections[0].interactive}
                            onSolved={() => setPreviewSolved(true)}
                            solvedAtMount={false}
                          />
                        </div>
                      </div>

                      <NbBox
                        shadow="nb-shadow-sm"
                        className={cn(
                          "mt-4 p-3",
                          previewSolved
                            ? "bg-[var(--chart-2)]"
                            : "bg-background",
                        )}
                      >
                        {previewSolved ? (
                          <p className="text-sm leading-relaxed">
                            You just finished a real piece of this module. The
                            other sections teach the same way — by doing.
                          </p>
                        ) : (
                          <p className="text-sm leading-relaxed">
                            That's the actual teaching style: read a little, do
                            a thing, move on. Sections 2 and 3 continue exactly
                            like this.
                          </p>
                        )}
                      </NbBox>
                    </NbBox>
                  )}
                </>
              )}
            </div>

            {/* Buy card */}
            <div>
              <NbBox className="nb-shadow-lg sticky top-20 bg-card p-5">
                <p className="font-mono text-3xl font-bold">{price}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  One-time payment · yours forever
                </p>

                {owned || checkoutState === "paid" ? (
                  <>
                    <NbRouterLink
                      to={`/learn/${lesson.slug}`}
                      variant="success"
                      className="mt-4 w-full"
                    >
                      <BookOpenCheck className="size-4" /> Start the course
                    </NbRouterLink>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      Receipt sent to your email.
                    </p>
                  </>
                ) : lesson.isFree ? (
                  <NbRouterLink
                    to={`/learn/${lesson.slug}`}
                    variant="accent"
                    className="mt-4 w-full"
                  >
                    Start learning now
                  </NbRouterLink>
                ) : waitingForConfirm ? (
                  <NbBox className="mt-4 bg-accent p-3 text-center">
                    <p className="text-sm font-bold uppercase">
                      Payment received — confirming…
                    </p>
                    <p className="mt-1 text-xs leading-relaxed">
                      Usually a few seconds. This page unlocks automatically.
                    </p>
                  </NbBox>
                ) : checkoutState === "pending" ? (
                  <NbButton className="mt-4 w-full" disabled>
                    Processing payment…
                  </NbButton>
                ) : (
                  <NbButton className="mt-4 w-full" onClick={handleBuy}>
                    <ShoppingCart className="size-4" /> Buy this module
                  </NbButton>
                )}

                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}

                <div className="my-4 border-t-2 border-dashed border-border" />
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Prefer a live session?</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Book a 1-on-1 walkthrough of this module with your
                      instructor.
                    </p>
                    <Link
                      to={`/book/${lesson.slug}`}
                      className="mt-1.5 inline-block text-xs font-bold uppercase tracking-widest underline"
                    >
                      Pick a time →
                    </Link>
                  </div>
                </div>

                <p className="mt-4 nb-border bg-secondary px-2 py-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-widest text-muted-foreground">
                  Demo checkout active — no card is charged. Real card payments
                  via Stripe arrive with your Stripe keys.
                </p>
              </NbBox>
            </div>
          </div>
        )}
      </NbSection>
    </div>
  );
}
