/**
 * Interactive games, part 2 — pick-the-best, grow-the-site checklist,
 * and the sentence assembler (prompt builder).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameButton, GameFeedback } from "./games";

/* ------------------------------------------------------------------ */
/* Pick-the-best: several plausible options, one clearly best          */
/* ------------------------------------------------------------------ */

export function NbPickBestGame({
  prompt,
  options,
  onSolved,
  solvedText,
}: {
  prompt: string;
  options: { text: string; why: string; best?: boolean }[];
  onSolved: () => void;
  solvedText: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const solved = picked !== null && options[picked].best === true;
  const wrong = picked !== null && !solved;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{prompt}</p>
      <div className="mt-3 space-y-2">
        {options.map((o, i) => {
          const isPicked = picked === i;
          return (
            <button
              key={o.text}
              onClick={() => {
                setPicked(i);
                if (o.best) onSolved();
              }}
              className={cn(
                "nb-border nb-press w-full px-3 py-2 text-left text-sm",
                isPicked && o.best && "bg-[var(--chart-2)]",
                isPicked && !o.best && "nb-shake bg-destructive text-white",
                !isPicked && "bg-card",
              )}
            >
              <span className="font-bold">
                {isPicked ? (o.best ? "✓ " : "✗ ") : ""}
              </span>
              {o.text}
              {isPicked && (
                <span className="mt-1 block text-xs font-medium opacity-80">
                  {o.why}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <GameFeedback
        wrong={wrong}
        wrongText="Plausible, but not the strongest. Read the why, then try again."
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grow-the-site: add the missing pieces, reject the clutter           */
/* ------------------------------------------------------------------ */

export function NbGrowSiteGame({
  prompt,
  candidates,
  onSolved,
  solvedText,
}: {
  prompt: string;
  candidates: { text: string; keep: boolean; why: string }[];
  onSolved: () => void;
  solvedText: string;
}) {
  const [decided, setDecided] = useState<Record<number, boolean>>({});
  const allDecided = candidates.every((_, i) => decided[i] !== undefined);
  const correct = candidates.every((c, i) => decided[i] === c.keep);
  const solved = allDecided && correct;
  const wrong = allDecided && !correct;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{prompt}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Keep = your visitors need it. Cut = noise that buries your one job.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {candidates.map((c, i) => {
          const choice = decided[i];
          return (
            <div
              key={c.text}
              className={cn(
                "nb-border px-3 py-2",
                solved && c.keep && "bg-[var(--chart-2)]",
                choice === false && c.keep && "bg-destructive text-white",
                choice === true && !c.keep && "bg-destructive text-white",
                choice === undefined && "bg-card",
                solved && !c.keep && "bg-secondary opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm">{c.text}</span>
                <span className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setDecided((d) => ({ ...d, [i]: true }))}
                    aria-label={`Keep: ${c.text}`}
                    className={cn(
                      "nb-border nb-press bg-background p-1",
                      choice === true && "bg-[var(--chart-2)]",
                    )}
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDecided((d) => ({ ...d, [i]: false }))}
                    aria-label={`Cut: ${c.text}`}
                    className={cn(
                      "nb-border nb-press bg-background p-1",
                      choice === false && "bg-destructive text-white",
                    )}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              </div>
              {choice !== undefined && (
                <p className="mt-1 text-xs font-medium opacity-80">
                  {c.keep ? "Keep — " : "Cut — "}
                  {c.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!solved && (
        <div className="mt-3 flex gap-2">
          <GameButton
            onClick={() => {
              if (allDecided && correct) onSolved();
              else setDecided((d) => ({ ...d }));
            }}
            disabled={!allDecided}
            className={cn(!allDecided && "opacity-40")}
          >
            Check my choices
          </GameButton>
          <GameButton
            tone="plain"
            onClick={() => setDecided({})}
          >
            <RotateCcw className="mr-1 inline size-3" /> Reset
          </GameButton>
        </div>
      )}
      <GameFeedback
        wrong={wrong}
        wrongText="The red cards are misjudged — read the reason and flip them."
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sentence assembler: build a strong prompt from fragments            */
/* ------------------------------------------------------------------ */

export function NbPromptBuilderGame({
  prompt,
  fragments,
  onSolved,
  solvedText,
}: {
  prompt: string;
  fragments: { text: string; correct: boolean; why: string }[];
  onSolved: () => void;
  solvedText: string;
}) {
  const [chosen, setChosen] = useState<number[]>([]);
  const correctOrder = fragments
    .map((f, i) => ({ ...f, i }))
    .filter((f) => f.correct);
  const solved =
    chosen.length === correctOrder.length &&
    chosen.every((ci, pos) => chosen[pos] === correctOrder[pos].i);
  // At or over the required count counts as an attempt — a learner who adds
  // one fragment too many deserves corrective feedback, not a neutral nudge.
  const attempted = chosen.length >= correctOrder.length;
  const wrong = attempted && !solved;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{prompt}</p>
      {/* The sentence so far */}
      <div className="nb-border nb-shadow-sm mt-3 min-h-16 bg-background p-3">
        {chosen.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            Tap fragments below to build the prompt…
          </p>
        ) : (
          <motion.p layout className="text-sm leading-relaxed">
            {chosen.map((ci, pos) => (
              <motion.span
                key={`${ci}-${pos}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="nb-code mr-1 inline-block"
              >
                {fragments[ci].text}
              </motion.span>
            ))}
          </motion.p>
        )}
      </div>

      {/* Fragment bank */}
      <div className="mt-3 flex flex-wrap gap-2">
        {fragments.map((f, i) => {
          const usedAt = chosen.indexOf(i);
          return (
            <motion.button
              layout
              key={f.text}
              onClick={() => {
                if (solved) return;
                const next =
                  usedAt >= 0
                    ? chosen.filter((c) => c !== i)
                    : [...chosen, i];
                setChosen(next);
                // Fire the moment the assembled sentence is exactly right —
                // the same contract as the other games, so a correct build
                // can never get stuck waiting on a button that already hid.
                if (
                  next.length === correctOrder.length &&
                  next.every((ci, pos) => ci === correctOrder[pos].i)
                ) {
                  onSolved();
                }
              }}
              className={cn(
                "nb-border nb-press px-2.5 py-1.5 font-mono text-xs font-bold",
                usedAt >= 0
                  ? "bg-[var(--chart-2)] opacity-50"
                  : "bg-card",
                wrong && !f.correct && usedAt >= 0 && "bg-destructive text-white",
              )}
            >
              {f.text}
            </motion.button>
          );
        })}
      </div>

      {!solved && (
        <div className="mt-3 flex gap-2">
          <GameButton tone="plain" onClick={() => setChosen([])}>
            <RotateCcw className="mr-1 inline size-3" /> Clear
          </GameButton>
        </div>
      )}
      <GameFeedback
        wrong={wrong}
        wrongText="Close — but the order matters. Audience first, then what, then vibe."
        solved={solved}
        solvedText={solvedText}
      />
      {solved && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="size-3.5" /> {correctOrder.map((f) => f.why).join(" ")}
        </p>
      )}
    </div>  );
}

/* ------------------------------------------------------------------ */
/* Vibe switcher: same site, three outfits, one live preview           */
/* ------------------------------------------------------------------ */
export function NbVibeSwitcherGame({
  onSolved,
  solvedText,
}: {
  onSolved: () => void;
  solvedText: string;
}) {
  const VIBES = [
    {
      id: "warm",
      label: "Warm & friendly",
      bg: "bg-[var(--chart-4)]",
      headline: "Fresh bread, baked every morning",
      btn: "Order for pickup",
    },
    {
      id: "bold",
      label: "Bold & modern",
      bg: "bg-primary",
      headline: "SOURDOUGH. STARTER SINCE 2019.",
      btn: "GET YOURS",
    },
    {
      id: "calm",
      label: "Calm & premium",
      bg: "bg-[var(--chart-3)]",
      headline: "Slow-fermented, small-batch sourdough",
      btn: "Reserve a loaf",
    },
  ] as const;

  const [tried, setTried] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string>(VIBES[0].id);
  const solved = tried.size >= VIBES.length;
  const current = VIBES.find((v) => v.id === active) ?? VIBES[0];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Same bakery, three vibes. Switch the outfit — try all three to feel
        how much style carries.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {VIBES.map((v) => (
          <GameButton
            key={v.id}
            tone={tried.has(v.id) ? "plain" : "accent"}
            onClick={() => {
              const next = new Set(tried).add(v.id);
              setTried(next);
              setActive(v.id);
              if (next.size >= VIBES.length) onSolved();
            }}
          >
            {v.label}
            {tried.has(v.id) ? " ✓" : ""}
          </GameButton>
        ))}
      </div>
      <motion.div
        key={active}
        initial={{ opacity: 0.6, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={cn("nb-border nb-shadow mt-3 p-4", current.bg)}
      >
        <p className="text-lg font-bold uppercase tracking-tight">
          {current.headline}
        </p>
        <p className="mt-1 max-w-md text-sm opacity-80">
          Hand-mixed, 24-hour ferment, baked before your alarm goes off.
        </p>
        <span className="nb-border nb-shadow-sm mt-3 inline-block bg-background px-3 py-1.5 text-xs font-bold uppercase">
          {current.btn}
        </span>
      </motion.div>
      <GameFeedback
        wrong={false}
        wrongText=""
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}

