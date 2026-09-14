/**
 * Certificate — a printable "Certificate of Completion" for the free lesson.
 * Route is public (the achievement itself is honest: the learner finished
 * Lesson 1 — checkmarks live in localStorage / Convex progress).
 */
import { Navigate, useParams } from "react-router";
import { Printer } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/SiteHeader";
import { NbBox, NbRouterLink, NbSection } from "@/components/nb";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { LESSON_ID, LESSON_STEP_TITLES } from "@/lib/lessonMeta";

const TOTAL_STEPS = LESSON_STEP_TITLES.length;

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Certificate() {
  usePageTitle("Certificate");
  const { name } = useParams();
  const { user, isLoading } = useAuth();
  // Signed-in: verify the achievement honestly against saved progress.
  const progress = useQuery(api.progress.getLessonProgress, {
    lessonId: LESSON_ID,
  });

  const rawName = name ?? user?.name ?? "";
  const learnerName = rawName.trim().slice(0, 60);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <NbSection className="py-20 text-center text-sm text-muted-foreground">
          Loading…
        </NbSection>
      </div>
    );
  }

  // Signed-in learner whose progress query is still resolving: hold the
  // loading screen. Deciding "not earned" before the data arrives would
  // flash "Finish the lesson first" at someone who already finished.
  if (user && progress === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <NbSection className="py-20 text-center text-sm text-muted-foreground">
          Checking your progress…
        </NbSection>
      </div>
    );
  }

  if (!learnerName) {
    return <Navigate to="/auth?returnTo=%2Fcertificate" replace />;
  }

  // Integrity gate (signed-in users only): the certificate is earned, not
  // printable-on-demand. Guests keep the honor-system path — the completion
  // screen they reached on this device still links here.
  const verified =
    !user || (progress?.completedSteps?.length ?? 0) >= TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <NbSection className="py-10 print:py-4">
        {!verified ? (
          <NbBox className="nb-shadow-lg mx-auto max-w-md bg-card p-8 text-center">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Almost there
            </p>
            <h1 className="mt-2 text-2xl font-bold uppercase">
              Finish the lesson first
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The certificate unlocks when all four steps are complete —
              that's what makes it worth printing.
            </p>
            <NbRouterLink to="/lesson" variant="accent" className="mt-5">
              Continue the lesson
            </NbRouterLink>
          </NbBox>
        ) : (
          <>
        {/* Screen-only controls */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Congratulations — you earned this. Print or save it as PDF.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="nb-border nb-shadow-sm nb-press inline-flex items-center gap-2 bg-accent px-3 py-2 text-xs font-bold uppercase tracking-wide"
            >
              <Printer className="size-4" /> Print / save PDF
            </button>
            <NbRouterLink to="/dashboard" variant="ghost" className="text-xs">
              Dashboard
            </NbRouterLink>
          </div>
        </div>

        {/* The certificate itself */}
        <NbBox
          className="nb-shadow-lg mx-auto max-w-3xl bg-card p-6 sm:p-10"
          style={{
            ["--nb-rot" as string]: "0deg",
          }}
        >
          <div className="nb-border-4 p-6 text-center sm:p-10">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Certificate of Completion
            </p>

            <div className="mx-auto mt-5 h-1 w-16 bg-accent" />

            <p className="mt-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              This certifies that
            </p>
            <h1 className="mt-2 text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl">
              {learnerName}
            </h1>

            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              has completed the interactive lesson
            </p>
            <p className="mt-2 text-xl font-bold uppercase sm:text-2xl">
              Web Development with AI — Lesson 1: The Basics
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Understanding what a website is, what it's made of, and where AI
              fits in — including building a first website hands-on.
            </p>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-6 text-left">
              <div>
                <p className="border-t-2 border-border pt-1 font-mono text-xs font-bold">
                  {formatToday()}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Date
                </p>
              </div>
              <div className="nb-border bg-primary px-3 py-1.5 text-center text-primary-foreground">
                <p className="font-mono text-xs font-bold uppercase tracking-widest">
                  Web Dev × AI
                </p>
              </div>
              <div>
                <p className="border-t-2 border-border pt-1 font-mono text-xs font-bold">
                  Instructor
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Web Development with AI
                </p>
              </div>
            </div>
          </div>
        </NbBox>

        {/* Screen-only next step */}
        <div className="mx-auto mt-6 max-w-3xl print:hidden">
          <NbBox className="bg-secondary p-4 text-center">
            <p className="text-sm font-bold uppercase">
              Proud of it? Share the link:
            </p>
            <p className="nb-code mt-2 inline-block break-all">
              {`${window.location.origin}/certificate/${encodeURIComponent(learnerName)}`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <NbRouterLink to="/catalog" variant="accent" className="text-xs">
                Keep learning — browse modules
              </NbRouterLink>
            </div>
          </NbBox>
        </div>
          </>
        )}
      </NbSection>
    </div>
  );
}
