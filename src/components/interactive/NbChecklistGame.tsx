/**
 * Interactive games, part 3 — the checklist (multi-select).
 */
import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameButton, GameFeedback } from "./games";

export function NbChecklistGame({
  prompt,
  items,
  mustSelect,
  onSolved,
  solvedText,
}: {
  prompt: string;
  items: { text: string }[];
  mustSelect: number[];
  onSolved: () => void;
  solvedText: string;
}) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);

  const pass =
    mustSelect.every((i) => picked.has(i)) &&
    [...picked].every((i) => mustSelect.includes(i));
  const solved = checked && pass;
  const wrong = checked && !pass;

  return (
    <div>
      <p className="text-sm font-medium">{prompt}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => {
          const on = picked.has(i);
          const shouldBeOn = mustSelect.includes(i);
          return (
            <button
              key={item.text}
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
                on && !checked && "bg-accent",
                !on && "bg-card",
                checked && on && shouldBeOn && "bg-[var(--chart-2)]",
                checked && on && !shouldBeOn && "nb-shake bg-destructive text-white",
                checked && !on && shouldBeOn && "bg-[var(--chart-4)]",
              )}
            >
              <span>{item.text}</span>
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
              if (
                mustSelect.every((i) => picked.has(i)) &&
                [...picked].every((i) => mustSelect.includes(i))
              ) {
                onSolved();
              }
            }}
          >
            Check my picks
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
        wrongText="Not exactly — green boxes were required, red boxes were traps."
        solved={solved}
        solvedText={solvedText}
      />
    </div>
  );
}
