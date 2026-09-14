/**
 * BrowserSim — a fake browser window that teaches, step by step,
 * what happens when you open a website. Designed for non-technical
 * learners: zero jargon in the visuals, friendly labels everywhere.
 */
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { NbTag } from "./nb";

export interface BrowserSimStep {
  /** What the learner sees in the page body at this step. */
  body: React.ReactNode;
  /** Narration line under the browser. */
  caption: string;
  /** What the address bar shows. */
  url: string;
}

export function BrowserSim({
  steps,
  stepIndex,
  className,
}: {
  steps: BrowserSimStep[];
  stepIndex: number;
  className?: string;
}) {
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("w-full", className)}>
      {/* Browser chrome */}
      <div className="nb-border-4 bg-card">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b-2 border-border bg-secondary px-3 py-2">
          <div className="flex gap-1.5" aria-hidden>
            <span className="nb-border block size-3 bg-destructive/70" />
            <span className="nb-border block size-3 bg-[var(--chart-4)]/80" />
            <span className="nb-border block size-3 bg-[var(--chart-2)]/80" />
          </div>
          <div className="ml-1 flex-1 truncate border-2 border-border bg-background px-2 py-0.5 font-mono text-xs">
            {step?.url ?? "about:blank"}
          </div>
          <NbTag className="hidden sm:inline">Step {stepIndex + 1}</NbTag>
        </div>
        {/* Page body */}
        <div
          ref={bodyRef}
          className="nb-grid-bg relative min-h-[240px] bg-background p-4"
          aria-live="polite"
        >
          <div key={stepIndex} className="nb-pop">
            {step?.body}
          </div>
        </div>
      </div>
      {/* Caption */}
      <p className="nb-border mt-3 bg-accent px-3 py-2 text-sm font-medium leading-relaxed">
        {step?.caption}
      </p>
    </div>
  );
}
