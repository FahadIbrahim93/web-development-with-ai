/** Spot-the-difference: a short document review game.
 * Learners read a weak page draft, then flag the fixes that would actually
 * improve it. Neobrutalist flat blocks, 2px borders, honest feedback.
 *
 * Fits modules like content/copy, launch checks, or site-structure review,
 * where the teaching is "distance yourself from the page and edit it like
 * a stranger would read it."
 */
import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameButton, GameFeedback } from "./games";


export function NbSpotTheDifferenceGame({
  prompt,
  badDocument,
  fixes,
  onSolved,
  solvedText,
}: {
  prompt: string;
  badDocument: string;
  fixes: { label: string; text: string; correct: boolean }[];
  onSolved: () => void;
  solvedText: string;
}) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);

  const pass =
    fixes.every((f, i) => (f.correct ? picked.has(i) : !picked.has(i)));
  const solved = checked && pass;
  const wrong = checked && !pass;

  return (
    <div>
      <p className="text-sm font-medium">{prompt}</p>

      {/* The weak page draft, shown as a small artifact to review */}
      <div className="mt-3 nb-border bg-secondary p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          The page, as drafted
        </p>
        <pre className="mt-1 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {badDocument}
        </pre>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Which fixes would actually improve this page? Flag the right ones.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {fixes.map((fix, i) => {
          const on = picked.has(i);
          const shouldBeOn = fix.correct;
          return (
            <button
              key={fix.label}
              onClick={() => {
                if (solved) return;
                setChecked(false);
                setPicked((cur) => {
                  const next = new Set(cur);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                });
              }}
              className={cn(
                "nb-border nb-press flex items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                !on && "bg-card",
                on && !checked && "bg-accent",
                checked && on && shouldBeOn && "bg-[var(--chart-2)]",
                checked && on && !shouldBeOn && "nb-shake bg-destructive text-white",
                checked && !on && shouldBeOn && "bg-[var(--chart-4)]"
              )}
            >
              <span>{fix.label}</span>
              <span className="nb-border flex size-5 shrink-0 items-center justify-center bg-background font-mono text-[10px] font-bold">
                {checked ? (
                  shouldBeOn ? (
                    <Check className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )
                ) : on ? (
                  "✓"
                ) : (
                  ""
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!solved && (
        <div className="mt-3 flex gap-2">
          <GameButton
            onClick={() => {
              setChecked(true);
              if (fixes.every((f, i) => (f.correct ? picked.has(i) : !picked.has(i)))) {
                onSolved();
              }
            }}
          >
            Review my fixes
          </GameButton>
          <GameButton
            tone="plain"
            onClick={() => {
              setPicked(new Set());
              setChecked(false);
            }}
          >
            <RotateCcw className="mr-1 inline size-3" /> Reset
          </GameButton>
        </div>
      )}

      <GameFeedback
        wrong={wrong}
        wrongText="Some flagged fixes don't belong — the red ones should be left alone. Review, then re-check."
        solved={solved}
        solvedText={solvedText}
      />
      {solved && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {fixes.map((fix, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={cn(
                "shrink-0 mt-0.5 text-[10px] font-bold uppercase",
                fix.correct
                  ? "text-[var(--chart-2)]"
                  : "text-muted-foreground/60"
              )}>
                {fix.correct ? "keep" : "leave"}
              </span>
              <span>{fix.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
