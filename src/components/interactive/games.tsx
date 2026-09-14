/**
 * Interactive games, part 1 — ordering and matching.
 * Every game: neobrutalist flat blocks, 2px borders, hard shadows, honest
 * feedback (shake on wrong, green flash + confetti-ready onSolved on right).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared feedback strip                                               */
/* ------------------------------------------------------------------ */

export function GameFeedback({
  wrong,
  wrongText,
  solved,
  solvedText,
}: {
  wrong: boolean;
  wrongText: string;
  solved: boolean;
  solvedText: string;
}) {
  return (
    <p
      className={cn(
        "nb-border mt-3 px-3 py-2 text-sm font-medium",
        solved && "bg-[var(--chart-2)]",
        wrong && "nb-shake bg-destructive text-white",
        !solved && !wrong && "bg-secondary",
      )}
    >
      {solved ? solvedText : wrong ? wrongText : "Have a go — nothing to break."}
    </p>
  );
}

/** Small styled action button shared by the games. */
export function GameButton({
  children,
  onClick,
  tone = "accent",
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "accent" | "plain";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "nb-border nb-press px-3 py-1.5 text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        tone === "accent" ? "nb-shadow-sm bg-accent" : "bg-background",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Ordering game: put the steps in the right order                     */
/* ------------------------------------------------------------------ */

function shuffledIndices(n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  // Fisher–Yates so the puzzle is never accidentally pre-solved.
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // Guarantee it actually needs solving.
  if (n > 1 && idx.every((v, i) => v === i)) [idx[0], idx[1]] = [idx[1], idx[0]];
  return idx;
}

export function NbOrderGame({
  prompt,
  items,
  onSolved,
  solvedText = "In exactly the right order. That's the whole workflow.",
}: {
  prompt: string;
  items: { text: string }[];
  onSolved: () => void;
  solvedText?: string;
}) {
  const [order, setOrder] = useState<number[]>(() =>
    shuffledIndices(items.length),
  );
  const [checked, setChecked] = useState(false);
  const solved = checked && order.every((v, i) => v === i);
  const wrong = checked && !solved;

  const move = (pos: number, dir: -1 | 1) => {
    if (solved) return;
    setOrder((cur) => {
      const next = [...cur];
      const target = pos + dir;
      if (target < 0 || target >= next.length) return cur;
      [next[pos], next[target]] = [next[target], next[pos]];
      return next;
    });
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    if (order.every((v, i) => v === i)) onSolved();
  };

  return (
    <div>
      <p className="text-sm font-medium">{prompt}</p>
      <div className="mt-3 space-y-2">
        {order.map((itemIdx, pos) => (
          <motion.div
            layout
            key={itemIdx}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className={cn(
              "nb-border flex items-center justify-between gap-2 bg-card px-3 py-2",
              wrong && "nb-shake",
              solved && "bg-[var(--chart-2)]",
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <span className="nb-border bg-secondary px-1.5 font-mono text-xs font-bold">
                {pos + 1}
              </span>
              {items[itemIdx].text}
            </span>
            <span className="flex gap-1">
              <button
                onClick={() => move(pos, -1)}
                disabled={pos === 0 || solved}
                aria-label="Move up"
                className="nb-border nb-press bg-background p-1 disabled:opacity-30"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                onClick={() => move(pos, 1)}
                disabled={pos === order.length - 1 || solved}
                aria-label="Move down"
                className="nb-border nb-press bg-background p-1 disabled:opacity-30"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </span>
            {solved && <Check className="size-4" />}
          </motion.div>
        ))}
      </div>

      {!solved && (
        <div className="mt-3 flex gap-2">
          <GameButton onClick={check}>Check my order</GameButton>
          <GameButton
            tone="plain"
            onClick={() => {
              setOrder(shuffledIndices(items.length));
              setChecked(false);
            }}
          >
            <RotateCcw className="mr-1 inline size-3" /> Reshuffle
          </GameButton>
        </div>
      )}

      <GameFeedback
        wrong={wrong}
        wrongText="Not quite — use the arrows to rearrange, then check again."
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Matching game: connect a concept to its everyday analogy            */
/* ------------------------------------------------------------------ */

export function NbMatchGame({
  prompt,
  pairs,
  onSolved,
  solvedText = "All matched — these analogies are yours now.",
}: {
  prompt: string;
  pairs: { concept: string; analogy: string }[];
  onSolved: () => void;
  solvedText?: string;
}) {
  // Click a concept, then its match (or the other way around).
  const analogies = useState(() =>
    shuffledIndices(pairs.length).map((i) => ({ text: pairs[i].analogy, idx: i })),
  )[0];

  const [assigned, setAssigned] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const solved = checked && pairs.every((_, i) => assigned[i] === i);
  const wrong = checked && !solved;

  const assignedAnalogyIdxs = new Set(Object.values(assigned));

  const clickConcept = (i: number) => {
    if (solved) return;
    setChecked(false);
    if (assigned[i] !== undefined) {
      // Detach, then leave it selected for re-assignment.
      setAssigned((cur) => {
        const next = { ...cur };
        delete next[i];
        return next;
      });
      setSelected(i);
      setPending(null);
    } else if (pending !== null) {
      setAssigned((cur) => ({ ...cur, [i]: pending }));
      setPending(null);
      setSelected(null);
    } else {
      setSelected((cur) => (cur === i ? null : i));
    }
  };

  const clickAnalogy = (j: number) => {
    if (solved) return;
    setChecked(false);
    const owner = Object.entries(assigned).find(
      ([, v]) => v === j,
    )?.[0];
    if (owner !== undefined) {
      setAssigned((cur) => {
        const next = { ...cur };
        delete next[Number(owner)];
        return next;
      });
      setSelected(null);
    } else if (selected !== null) {
      setAssigned((cur) => ({ ...cur, [selected]: j }));
      setSelected(null);
      setPending(null);
    } else {
      setPending((cur) => (cur === j ? null : j));
    }
  };

  return (
    <div>
      <p className="text-sm font-medium">{prompt}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Tap a concept, then tap its everyday match. Tap again to detach.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Concept
          </p>
          {pairs.map((p, i) => {
            const matchedRight = solved && assigned[i] === i;
            const flagged = checked && assigned[i] !== undefined && assigned[i] !== i;
            return (
              <button
                key={p.concept}
                onClick={() => clickConcept(i)}
                className={cn(
                  "nb-border nb-press flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                  matchedRight
                    ? "bg-[var(--chart-2)]"
                    : flagged
                      ? "nb-shake bg-destructive text-white"
                      : "bg-card",
                  selected === i && "ring-2 ring-[var(--border)] ring-offset-2 ring-offset-background",
                )}
              >
                <span>{p.concept}</span>
                <span className="nb-border bg-secondary px-1.5 font-mono text-xs font-bold">
                  {assigned[i] !== undefined
                    ? String.fromCharCode(65 + assigned[i])
                    : "?"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Everyday match
          </p>
          {analogies.map((a) => (
            <button
              key={a.text}
              onClick={() => clickAnalogy(a.idx)}
              className={cn(
                "nb-border nb-press w-full px-3 py-2 text-left text-sm",
                assignedAnalogyIdxs.has(a.idx) || pending === a.idx
                  ? "bg-accent"
                  : "bg-background",
              )}
            >
              <span className="mr-1 font-mono text-xs font-bold">
                {String.fromCharCode(65 + a.idx)} ·
              </span>
              {a.text}
            </button>
          ))}
        </div>
      </div>

      {!solved && (
        <div className="mt-3 flex gap-2">
          <GameButton
            onClick={() => {
              setChecked(true);
              if (pairs.every((_, i) => assigned[i] === i)) onSolved();
            }}
          >
            Check my matches
          </GameButton>
          <GameButton
            tone="plain"
            onClick={() => {
              setAssigned({});
              setSelected(null);
              setPending(null);
              setChecked(false);
            }}
          >
            <RotateCcw className="mr-1 inline size-3" /> Reset
          </GameButton>
        </div>
      )}

      <GameFeedback
        wrong={wrong}
        wrongText="Some pairs don't fit — the wrong ones are flagged in red. Swap and re-check."
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}
