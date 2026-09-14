/**
 * Lesson — the interactive lesson shell. Hosts the four steps, tracks
 * progress for signed-in users in Convex (with a localStorage fallback),
 * and shows a completion screen.
 */
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Home, Trophy } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { Step1 } from "@/components/lesson/Step1";
import { Step2 } from "@/components/lesson/Step2";
import { Step3 } from "@/components/lesson/Step3";
import { Step4 } from "@/components/lesson/Step4";
import { NbBox, NbButton, NbRouterLink, NbSection, NbTag } from "@/components/nb";
import { NbConfetti } from "@/components/interactive/NbConfetti";
import { NbGrowSiteGame } from "@/components/interactive/games2";
import { LESSON_ID, LESSON_STEP_TITLES } from "@/lib/lessonMeta";
import { cn } from "@/lib/utils";

const STEP_TITLES = LESSON_STEP_TITLES;

export default function Lesson() {
  usePageTitle("Free interactive lesson");
  const { isAuthenticated } = useAuth();
  const saveProgress = useMutation(api.progress.saveLessonProgress);
  const serverProgress = useQuery(api.progress.getLessonProgress, {
    lessonId: LESSON_ID,
  });

  const [step, setStep] = useState(() => {
    const stored = window.localStorage.getItem(`${LESSON_ID}.step`);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [completed, setCompleted] = useState<Set<number>>(() => {
    const stored = window.localStorage.getItem(`${LESSON_ID}.completed`);
    return stored ? new Set(JSON.parse(stored) as number[]) : new Set();
  });
  const [finished, setFinished] = useState(false);
  const [finishBurst, setFinishBurst] = useState(0);
  const [siteSolvedBurst, setSiteSolvedBurst] = useState(0);

  // Merge server progress (signed-in) with local progress — take the max.
  const effectiveCompleted = useMemo(() => {
    const merged = new Set(completed);
    if (serverProgress?.completedSteps) {
      for (const s of serverProgress.completedSteps) merged.add(s);
    }
    return merged;
  }, [completed, serverProgress]);

  // Server progress seeds the step once (first load only) so it never yanks
  // the learner back mid-session. Local navigation always wins afterwards.
  // Adjusted during render (React-endorsed pattern for deriving state from
  // async data) instead of setState-inside-useMemo, which can loop.
  const [seededFromServer, setSeededFromServer] = useState(false);
  if (!seededFromServer && serverProgress && serverProgress.step > step) {
    setSeededFromServer(true);
    setStep(serverProgress.step);
  }
  const effectiveStep = step;

  const persist = useCallback(
    (nextStep: number, nextCompleted: Set<number>) => {
      window.localStorage.setItem(
        `${LESSON_ID}.step`,
        String(nextStep),
      );
      window.localStorage.setItem(
        `${LESSON_ID}.completed`,
        JSON.stringify([...nextCompleted]),
      );
      if (isAuthenticated) {
        void saveProgress({
          lessonId: LESSON_ID,
          step: nextStep,
          completedSteps: [...nextCompleted],
        });
      }
    },
    [isAuthenticated, saveProgress],
  );

  const markSolved = useCallback(() => {
    setCompleted((prev) => {
      const next = new Set(prev).add(effectiveStep);
      persist(effectiveStep, next);
      return next;
    });
  }, [effectiveStep, persist]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(3, next));
      setStep(clamped);
      persist(clamped, completed);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [completed, persist],
  );

  const steps = [
    <Step1 key="s1" onNext={() => goTo(1)} onSolved={markSolved} />,
    <Step2 key="s2" onNext={() => goTo(2)} onSolved={markSolved} />,
    <Step3 key="s3" onNext={() => goTo(3)} onSolved={markSolved} />,
    <Step4 key="s4" onSolved={markSolved} onFinish={() => { markSolved(); setFinished(true); setFinishBurst((k) => k + 1); }} />,
  ];

  if (finished) {
    return (
      <main className="min-h-screen bg-background">
        <LessonTopBar onHome={() => setFinished(false)} />
        <NbSection className="relative py-16">
          <NbConfetti burstKey={finishBurst} />
          <NbConfetti burstKey={siteSolvedBurst} />
          <NbBox className="nb-shadow-lg relative mx-auto max-w-xl bg-accent p-8 text-center">
            <Trophy className="nb-wiggle mx-auto size-12" />
            <h1 className="mt-4 text-3xl font-bold uppercase tracking-tight">
              Lesson complete!
            </h1>
            <p className="mt-3 text-sm leading-relaxed">
              You now know what a website is, what it&apos;s made of, where AI
              fits in — and you&apos;ve already built one. That&apos;s more
              than most people who say they want to &quot;learn web dev.&quot;
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <NbGrowSiteGame
                prompt="Full rebuild challenge: decide what actually belongs on a homepage — before a designer ever opens Figma."
                candidates={[
                  { text: "A one-line promise of what you do", keep: true, why: "Visitors decide in seconds — one sentence wins." },
                  { text: "Eight different navigation items", keep: false, why: "Nobody reads a menu that long; it buries the one job." },
                  { text: "A real photo of your work or product", keep: true, why: "Proof beats promise — people need to trust you fast." },
                  { text: "A press logo carousel", keep: false, why: "Nobody came for logos; it's decoration that steals attention." },
                ]}
                onSolved={() => setSiteSolvedBurst((k) => k + 1)}
                solvedText="That's a homepage worth opening. Now play the same game on real sites — this is how good designers think."
              />
              <NbRouterLink to="/certificate" variant="primary">
                Get your certificate
              </NbRouterLink>
              <NbRouterLink to="/dashboard" variant="ghost">
                Go to dashboard
              </NbRouterLink>
              <NbButton variant="ghost" onClick={() => setFinished(false)}>
                Replay lesson
              </NbButton>
            </div>
            <p className="mt-6 nb-border bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
              Certificate of participation — Web Development with AI · Lesson 1
            </p>
          </NbBox>
        </NbSection>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <LessonTopBar />
      {/* Stepper */}
      <NbSection className="pt-6">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {STEP_TITLES.map((title, i) => {
            const isDone = effectiveCompleted.has(i);
            const isActive = i === effectiveStep;
            return (
              <button
                key={title}
                onClick={() => goTo(i)}
                className={cn(
                  "nb-border nb-press px-2 py-2 text-left",
                  isActive ? "bg-accent" : "bg-card",
                )}
              >
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                  {isDone ? "✓" : i + 1}
                </span>
                <span className="mt-0.5 hidden text-[11px] font-bold uppercase leading-tight sm:block">
                  {title}
                </span>
              </button>
            );
          })}
        </div>
      </NbSection>

      {/* Active step — only the current one is mounted */}
      <div key={effectiveStep} className="nb-pop">
        {steps[effectiveStep]}
      </div>

      <footer className="border-t-2 border-border py-6 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Web Development with AI · Lesson 1 · v1
        </p>
      </footer>
    </main>
  );
}

function LessonTopBar({ onHome }: { onHome?: () => void }) {
  return (
    <header className="border-b-2 border-border bg-secondary">
      <NbSection className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <NbRouterLink
            to="/"
            variant="primary"
            className="px-2 py-1 text-xs"
          >
            <span className="flex items-center gap-1.5">
              {onHome ? <ArrowLeft className="size-3" /> : <Home className="size-3" />}
              Web Dev × AI
            </span>
          </NbRouterLink>
          <NbTag className="hidden sm:inline-block">Lesson 1 · The Basics</NbTag>
        </div>
      </NbSection>
    </header>
  );
}
