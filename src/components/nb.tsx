/**
 * Shared Neobrutalism Minimalism primitives.
 * Square corners, 2px black borders, flat color blocks, hard offset shadows.
 */
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Section wrapper                                                     */
/* ------------------------------------------------------------------ */

export function NbSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-5xl px-4", className)}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Border box — flat color block with hard shadow                      */
/* ------------------------------------------------------------------ */

export function NbBox({
  children,
  className,
  shadow = "nb-shadow",
  as: As = "div",
  ...props
}: ComponentProps<"div"> & {
  shadow?: "nb-shadow" | "nb-shadow-lg" | "nb-shadow-sm";
  as?: "div" | "section" | "article";
}) {
  return (
    <As className={cn("nb-border", shadow, className)} {...props}>
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function NbButton({
  children,
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "accent" | "ghost" | "success";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-[var(--chart-2)] text-foreground",
    ghost: "bg-background text-foreground",
  } as const;

  return (
    <button
      className={cn(
        "nb-border nb-shadow-sm nb-press inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function NbRouterLink({
  children,
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: "primary" | "accent" | "ghost" | "success";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground",
    accent: "bg-accent text-accent-foreground",
    success: "bg-[var(--chart-2)] text-foreground",
    ghost: "bg-background text-foreground",
  } as const;

  return (
    <Link
      className={cn(
        "nb-border nb-shadow-sm nb-press inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Tag                                                                 */
/* ------------------------------------------------------------------ */

export function NbTag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "nb-border bg-background px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

export function NbDisclosure({
  title,
  children,
  icon = "+",
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <details className="group nb-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-bold">
        <span>{title}</span>
        <span className="nb-border bg-accent px-1.5 font-mono transition-transform group-open:rotate-45">
          {icon}
        </span>
      </summary>
      <div className="border-t-2 border-border px-3 py-2 text-sm leading-relaxed">
        {children}
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive hotspot dot                                             */
/* ------------------------------------------------------------------ */

export function NbHotspotDot({
  kind,
  label,
  onClick,
}: {
  kind: "idle" | "done";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "nb-border nb-press flex size-6 items-center justify-center bg-card font-mono text-xs font-bold",
        kind === "done" && "bg-[var(--chart-2)]",
      )}
    >
      {kind === "done" ? "✓" : "?"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Multiple choice quiz                                                */
/* ------------------------------------------------------------------ */

export interface QuizOption {
  label: string;
  correct?: boolean;
}

export function NbQuiz({
  question,
  options,
  onSolved,
}: {
  question: string;
  options: QuizOption[];
  onSolved?: () => void;
}) {
  // Each rendered quiz owns fresh state; keys differ per question.
  const [picked, setPicked] = useState<string | null>(null);
  const solved = picked !== null && options.find((o) => o.label === picked)?.correct;

  return (
    <div className="nb-border bg-card">
      <p className="border-b-2 border-border bg-secondary px-3 py-2 text-sm font-bold">
        {question}
      </p>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {options.map((o) => {
          const isPicked = picked === o.label;
          return (
            <button
              key={o.label}
              onClick={() => {
                setPicked(o.label);
                if (o.correct) onSolved?.();
              }}
              className={cn(
                "nb-border nb-press bg-background px-3 py-2 text-left text-sm font-medium",
                isPicked && o.correct && "bg-[var(--chart-2)]",
                isPicked && !o.correct && "bg-destructive text-white",
              )}
            >
              {o.label}
              {isPicked && (o.correct ? "  ✓" : "  ✗")}
            </button>
          );
        })}
      </div>
      {picked && (
        <p className="border-t-2 border-border px-3 py-2 text-sm">
          {solved ? "Correct! You're getting it." : "Not quite — try another answer."}
        </p>
      )}
    </div>
  );
}
