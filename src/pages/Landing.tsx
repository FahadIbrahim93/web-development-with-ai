/**
 * Landing — Web Development with AI. Neobrutalism Minimalism: square
 * corners, hard shadows, flat color blocks. One job: start the free lesson
 * or browse the catalog.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  ChefHat,
  CircleDot,
  GitFork,
  Mail,
  MousePointerClick,
  Rocket,
  Sparkles,
  Star,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  NbBox,
  NbButton,
  NbRouterLink,
  NbSection,
  NbTag,
} from "@/components/nb";
import { SiteHeader } from "@/components/SiteHeader";
import { timeAgo } from "@/lib/githubShape";

const PILLARS = [
  {
    icon: ChefHat,
    title: "Plain-language teaching",
    body: "No jargon walls. Browsers, servers, and files explained with everyday analogies you already understand.",
    bg: "bg-accent",
  },
  {
    icon: MousePointerClick,
    title: "Learn by clicking, not watching",
    body: "Every concept comes as a small interactive demo — poke it, break it, fix it. That's how it sticks.",
    bg: "bg-[var(--chart-3)]",
  },
  {
    icon: Sparkles,
    title: "AI does the typing",
    body: "You describe what you want; AI writes the code. You learn the judgment, not the syntax.",
    bg: "bg-[var(--chart-2)]",
  },
  {
    icon: Rocket,
    title: "Finish with something real",
    body: "Each module ends with a working piece of your own website — not a certificate of attendance.",
    bg: "bg-[var(--chart-4)]",
  },
];

export default function Landing() {
  usePageTitle();
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);
  const waitlistCount = useQuery(api.waitlist.countWaitlist, {});
  const showcase = useQuery(api.showcase.listApproved, {});
  const repo = useQuery(api.githubCache.repoSnapshot, {});
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<
    "idle" | "done" | "error"
  >("idle");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const handleJoin = async () => {
    setWaitlistError(null);
    try {
      await joinWaitlist({ email });
      setWaitlistState("done");
      setEmail("");
    } catch (e) {
      setWaitlistError(e instanceof Error ? e.message : "Could not join.");
      setWaitlistState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="/" />

      {/* Hero */}
      <NbSection className="py-14 sm:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <NbTag className="bg-[var(--chart-5)]">
              For non-technical people · start free
            </NbTag>
            <h1 className="mt-4 text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
              Build your own{" "}
              <motion.span
                className="nb-border inline-block bg-accent px-2"
                animate={{
                  rotate: [0, -1.2, 1.2, 0],
                  scale: [1, 1.03, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                professional
              </motion.span>{" "}
              website — with AI
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Web Development with AI teaches everyday people to create a
              site they're proud of. No computer-science degree, no
              memorizing code — just clear lessons, honest guidance, and AI
              as your typing assistant.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <NbRouterLink to="/lesson" className="nb-shadow-lg px-6 py-3 text-base">
                Start the free lesson <ArrowRight className="size-4" />
              </NbRouterLink>
              <NbRouterLink to="/catalog" variant="ghost" className="px-5 py-3 text-base">
                Browse all modules
              </NbRouterLink>
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Lesson 1 is free · ~15 minutes · nothing to install
            </p>
          </div>

          {/* Mini fake browser */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          >
          <NbBox className="nb-float nb-shadow-lg bg-card p-4" style={{ "--nb-rot": "0.5deg" } as React.CSSProperties}>
            <div className="nb-border-4 bg-card">
              <div className="flex items-center gap-2 border-b-2 border-border bg-secondary px-3 py-2">
                <span className="nb-border block size-3 bg-destructive/70" />
                <span className="nb-border block size-3 bg-[var(--chart-4)]/80" />
                <span className="nb-border block size-3 bg-[var(--chart-2)]/80" />
                <div className="ml-1 flex-1 border-2 border-border bg-background px-2 py-0.5 font-mono text-[10px]">
                  your-first-site.com
                </div>
              </div>
              <div className="nb-dots space-y-2 p-3">
                <div className="nb-border bg-accent px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest">
                    ☕ Your business — open for visitors
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Menu", "About", "Book"].map((t) => (
                    <div key={t} className="nb-border bg-secondary px-2 py-1.5 text-center text-[10px] font-bold uppercase">
                      {t}
                    </div>
                  ))}
                </div>
                <div className="nb-border bg-background px-3 py-2 text-xs">
                  <span className="font-bold">🤖 Your AI assistant:</span>{" "}
                  "Describe the vibe — I'll handle the code. You stay the
                  boss."
                </div>
              </div>
            </div>
            <p className="mt-3 border-l-4 border-accent pl-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              You'll build this in the free lesson
            </p>
          </NbBox>
          </motion.div>
        </div>
      </NbSection>

      {/* Audience strip */}
      <div className="border-y-2 border-border bg-primary py-2.5">
        <NbSection className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
          <span>Shop owners</span>
          <span aria-hidden>✦</span>
          <span>Freelancers</span>
          <span aria-hidden>✦</span>
          <span>Community groups</span>
          <span aria-hidden>✦</span>
          <span>Job seekers</span>
          <span aria-hidden>✦</span>
          <span>The permanently curious</span>
        </NbSection>
      </div>

      {/* Pillars */}
      <NbSection className="py-14">
        <h2 className="text-3xl font-bold uppercase tracking-tight">
          Why this course works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
            <NbBox className={f.bg + " nb-shadow h-full p-5"}>
              <f.icon className="size-6" />
              <h3 className="mt-3 text-lg font-bold uppercase">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed">{f.body}</p>
            </NbBox>
            </motion.div>
          ))}
        </div>
      </NbSection>

      {/* How it works */}
      <NbSection className="pb-14">
        <NbBox className="bg-secondary p-6 sm:p-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            How it works
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Take the free lesson",
                b: "Fifteen interactive minutes. You'll understand what a website is and build a tiny one.",
              },
              {
                n: "02",
                t: "Pick your modules",
                b: "Search the catalog and buy only what you need. Everything is one-time payment, yours forever.",
              },
              {
                n: "03",
                t: "Launch & show off",
                b: "Publish your site, book a live session if you're stuck, and share your build in the showcase.",
              },
            ].map((s) => (
              <div key={s.n} className="nb-border bg-background p-4">
                <p className="font-mono text-2xl font-bold">{s.n}</p>
                <p className="mt-1 text-sm font-bold uppercase">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {s.b}
                </p>
              </div>
            ))}
          </div>
        </NbBox>
      </NbSection>

      {/* Social proof — real student builds, straight from the showcase */}
      {showcase && showcase.length > 0 && (
        <NbSection className="pb-14">
          <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            People like you already shipped
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {showcase.slice(0, 3).map((p) => (
              <NbBox key={p._id} className="nb-shadow flex flex-col bg-card p-5">
                <p className="text-sm font-bold uppercase leading-tight">
                  {p.title}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  by {p.authorName ?? "a student"}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {p.description.length > 140
                    ? `${p.description.slice(0, 140)}…`
                    : p.description}
                </p>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs font-bold uppercase tracking-widest underline"
                  >
                    Visit the site →
                  </a>
                )}
              </NbBox>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Real projects from the student showcase, shared with permission.
          </p>
        </NbSection>
      )}

      {/* Built in the open — live repo stats, only when the GitHub
          integration is configured (otherwise this section is absent). */}
      {repo && (
        <NbSection className="pb-14">
          <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            Built in the open
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            This very platform is public on GitHub — the same code you're
            using, in the open. And yes, it was built the way this course
            teaches: describe it, let AI type, review everything.
          </p>
          <a
            href={`https://github.com/${repo.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="nb-border nb-shadow mt-4 inline-flex flex-wrap items-center gap-x-5 gap-y-2 bg-card px-5 py-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="font-mono text-sm font-bold underline">{repo.repo}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm">
              <Star className="size-4" /> {repo.stars}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm">
              <GitFork className="size-4" /> {repo.forks}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-sm">
              <CircleDot className="size-4" /> {repo.openIssues} open issues
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              pushed {timeAgo(repo.pushedAt)}
            </span>
            {repo.latestReleaseTag && (
              <span className="nb-border bg-[var(--chart-5)] px-2 py-0.5 font-mono text-xs font-bold">
                {repo.latestReleaseTag}
              </span>
            )}
          </a>
        </NbSection>
      )}

      {/* Final CTA + waitlist capture */}
      <NbSection className="pb-16">
        <NbBox className="nb-shadow-lg bg-accent p-8 text-center">
          <h2 className="text-3xl font-bold uppercase tracking-tight">
            The internet is waiting for your site
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed">
            Join the students who stopped saying "I wish I had a website" and
            started saying "here's the link."
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <NbRouterLink to="/lesson" className="px-6 py-3 text-base">
              Start free now <ArrowRight className="size-4" />
            </NbRouterLink>
            <NbRouterLink to="/catalog" variant="ghost" className="px-5 py-3 text-base">
              <CalendarClock className="size-4" /> See modules & book a session
            </NbRouterLink>
          </div>

          <div className="mx-auto mt-8 max-w-md border-t-2 border-dashed border-border pt-6">
            {waitlistState === "done" ? (
              <p className="nb-border bg-background px-3 py-2.5 text-sm font-bold">
                You're on the list! We'll email you when new modules drop.
              </p>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Not ready yet? Get one useful web tip per email
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="nb-border flex-1 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                    aria-label="Email address"
                  />
                  <NbButton
                    onClick={handleJoin}
                    disabled={!email.includes("@")}
                    className="shrink-0"
                  >
                    <Mail className="size-4" /> Keep me posted
                  </NbButton>
                </div>
                {waitlistError && (
                  <p className="mt-2 text-sm text-destructive">{waitlistError}</p>
                )}
                {waitlistCount && waitlistCount.length > 5 && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {waitlistCount.length} people already on the list
                  </p>
                )}
              </>
            )}
          </div>
        </NbBox>
      </NbSection>

      <footer className="border-t-2 border-border py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Web Development with AI · Made for humans, typed by AI
        </p>
      </footer>
    </div>
  );
}
