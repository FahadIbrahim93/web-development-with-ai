/**
 * Book — schedule a 1:1 session for a module. Learner picks a date, sees
 * live slot availability, adds an optional note, and confirms.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CalendarCheck, Clock } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BOOKING_SLOTS as SLOTS } from "@/lib/courseRules";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { NbBox, NbButton, NbRouterLink, NbSection, NbTag } from "@/components/nb";
import { cn } from "@/lib/utils";

function nextDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function prettyDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Book() {
  usePageTitle("Book a session");
  const { slug = "" } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const lesson = useQuery(api.catalog.getLesson, { slug });
  const dates = useMemo(() => nextDays(8), []);
  const [date, setDate] = useState(dates[0]);
  const takenSlots = useQuery(api.bookings.listTakenSlots, { date });
  const createBooking = useMutation(api.bookings.createBooking);

  const [time, setTime] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The student's own timezone, detected once — shown for transparency and
  // stored with the booking so the instructor can convert times correctly.
  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time",
    [],
  );

  const handleBook = async () => {
    if (!time) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBooking({
        lessonSlug: slug,
        date,
        time,
        timezone: tz,
        note: note.trim() || undefined,
      });
      setBooked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Signed-out visitors can browse the form, but finishing the flow requires
  // an account (slots + confirmation emails are tied to one). Send them to
  // auth with a return path that lands them back here, form intact.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const params = new URLSearchParams();
      params.set("returnTo", `/book/${slug}`);
      params.set("reason", "booking");
      window.history.replaceState(null, "", `/auth?${params.toString()}`);
      window.location.reload();
    }
  }, [authLoading, isAuthenticated, slug]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="/catalog" />
        <NbSection className="py-20 text-center text-sm text-muted-foreground">
          Checking sign-in…
        </NbSection>
      </div>
    );
  }

  // Unknown slug: Convex returns null once resolved. Show an honest
  // not-found screen instead of a header stuck on "Loading…" forever.
  if (lesson === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="/catalog" />
        <NbSection className="py-20">
          <NbBox className="nb-shadow-lg mx-auto max-w-md bg-card p-8 text-center">
            <p className="font-bold uppercase">Module not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              It may have been renamed or unpublished.
            </p>
            <NbRouterLink to="/catalog" variant="accent" className="mt-4">
              Browse the catalog
            </NbRouterLink>
          </NbBox>
        </NbSection>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="/catalog" />
        <NbSection className="py-16">
          <NbBox className="nb-shadow-lg mx-auto max-w-lg bg-accent p-8 text-center">
            <CalendarCheck className="mx-auto size-10" />
            <h1 className="mt-3 text-2xl font-bold uppercase">You're booked!</h1>
            <p className="mt-2 text-sm leading-relaxed">
              Your 1:1 session for <strong>{lesson?.title ?? "this module"}</strong> is
              confirmed for {prettyDate(date)} at {time} ({tz}). A confirmation
              email is on its way, and the session appears in your dashboard.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <NbRouterLink to="/dashboard" variant="primary">
                Go to dashboard
              </NbRouterLink>
              <NbRouterLink to="/catalog" variant="ghost">
                Back to catalog
              </NbRouterLink>
            </div>
          </NbBox>
        </NbSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/catalog" />
      <NbSection className="py-10">
        <Link
          to={`/catalog/${slug}`}
          className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to module
        </Link>

        <NbTag className="mt-6 inline-block bg-accent">Live 1:1 session</NbTag>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">
          {lesson ? lesson.title : "Loading…"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Thirty minutes, just you and your instructor. Bring questions, your
          current progress, or a problem you're stuck on.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            {/* Date picker */}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              1 · Pick a day (weekdays only)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setTime(null);
                  }}
                  className={cn(
                    "nb-border nb-press px-3 py-2 font-mono text-xs font-bold",
                    date === d ? "bg-accent" : "bg-card",
                  )}
                >
                  {new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>

            {/* Slots */}
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              2 · Pick a time (your local clock)
            </p>
            {!takenSlots ? (
              <p className="mt-2 text-sm text-muted-foreground">Checking times…</p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {SLOTS.map((s) => {
                  const isTaken = takenSlots.includes(s);
                  return (
                    <button
                      key={s}
                      disabled={isTaken}
                      onClick={() => setTime(s)}
                      className={cn(
                        "nb-border nb-press px-2 py-2 font-mono text-xs font-bold",
                        time === s && "bg-accent",
                        isTaken && "cursor-not-allowed bg-muted text-muted-foreground line-through opacity-60",
                        !isTaken && time !== s && "bg-card",
                      )}
                      title={isTaken ? "Already booked" : undefined}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Clock className="mr-1 inline size-3" />
              Crossed-out times are already taken
            </p>

            {/* Note */}
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              3 · Anything I should know? (optional)
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. I'm stuck on making my menu look good on mobile."
              className="nb-border mt-2 w-full bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-[var(--chart-3)]"
            />
          </div>

          {/* Summary card */}
          <NbBox className="nb-shadow-lg h-fit bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your session
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p><strong>Module:</strong> {lesson?.title ?? "—"}</p>
              <p><strong>Day:</strong> {prettyDate(date)}</p>
              <p><strong>Time:</strong> {time ?? "not picked yet"}</p>
              <p><strong>Length:</strong> 30 minutes</p>
              <p><strong>Your timezone:</strong> {tz}</p>
              <p><strong>Where:</strong> video call link sent after booking</p>
            </div>
            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
            <NbButton
              className="mt-4 w-full"
              onClick={handleBook}
              disabled={!time || submitting}
            >
              {submitting ? "Booking…" : "Confirm booking"}
            </NbButton>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Free while the course is in beta.
            </p>
          </NbBox>
        </div>
      </NbSection>
    </div>
  );
}
