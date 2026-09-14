/**
 * Step 2 — Anatomy of a website.
 * An interactive picture of a café homepage: learners click numbered
 * hotspots on the design to learn HTML (structure), CSS (style), and
 * JavaScript (behavior) in plain language.
 */
import { useState } from "react";
import { ArrowRight, MousePointerClick } from "lucide-react";
import {
  NbBox,
  NbButton,
  NbHotspotDot,
  NbQuiz,
  NbSection,
  NbTag,
} from "@/components/nb";
import { cn } from "@/lib/utils";

interface Hotspot {
  id: string;
  label: string;
  short: string;
  long: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "structure",
    label: "HTML — the skeleton",
    short: "Headers, buttons, menus: the parts you can point at.",
    long: "HTML is like the skeleton of the page. It says 'here is a heading, here is a button, here is a photo.' Without HTML, a page has no parts to point at.",
  },
  {
    id: "style",
    label: "CSS — the outfit",
    short: "Colors, fonts, spacing: the part you can feel.",
    long: "CSS is the outfit the skeleton wears. It decides colors, sizes, fonts, and where things sit. Same skeleton, different outfit = completely different vibe.",
  },
  {
    id: "behavior",
    label: "JavaScript — the muscles",
    short: "Things that react when you tap or type.",
    long: "JavaScript is what makes the page react: menus that open, buttons that respond, forms that check your typing. It is the muscles moving the skeleton.",
  },
  {
    id: "content",
    label: "Content — the words & pictures",
    short: "The actual text and images people come for.",
    long: "Content is the reason people visit: the menu items, prices, photos. AI can help draft it, but a human should always fact-check it — it's your café, your voice.",
  },
];

/** Positions are percentages inside the fake page preview. */
const DOT_POS: Record<string, { left: string; top: string }> = {
  structure: { left: "6%", top: "10%" },
  style: { left: "78%", top: "30%" },
  behavior: { left: "40%", top: "62%" },
  content: { left: "66%", top: "82%" },
};

export function Step2({
  onNext,
  onSolved,
}: {
  onNext: () => void;
  onSolved: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    const next = new Set(visited).add(id);
    setVisited(next);
    if (next.size >= HOTSPOTS.length) onSolved();
  };

  const open = HOTSPOTS.find((h) => h.id === openId);

  return (
    <NbSection className="py-8">
      <div className="flex flex-wrap items-center gap-2">
        <NbTag>Step 2 of 4</NbTag>
        <NbTag className="bg-[var(--chart-3)]">Click the dots</NbTag>
      </div>

      <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight">
        What is a website made of?
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Every website — from a tiny café page to YouTube — is built from the
        same four ingredients. Click each{" "}
        <MousePointerClick className="inline size-4" /> numbered dot to peek
        inside.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Fake café page with hotspots */}
        <NbBox className="bg-card p-4">
          <div className="nb-border relative bg-background">
            {/* skeleton bars */}
            <div className="nb-border bg-accent px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-widest">
                ☕ The Corner Café
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2">
              {["Menu", "Find us", "About"].map((t) => (
                <div key={t} className="nb-border bg-secondary px-2 py-1.5 text-center text-[10px] font-bold uppercase">
                  {t}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 pt-0">
              <div className="nb-border bg-secondary h-20" />
              <div className="nb-border bg-secondary h-20" />
            </div>
            <div className="p-2 pt-0">
              <div className="nb-border bg-secondary h-3 w-3/4" />
              <div className="nb-border mt-2 bg-secondary h-3 w-1/2" />
            </div>

            {/* hotspot dots */}
            {HOTSPOTS.map((h) => (
              <button
                key={h.id}
                onClick={() => toggle(h.id)}
                aria-label={`Explain ${h.label}`}
                className="absolute size-24 -translate-x-1/2 -translate-y-1/2 bg-transparent"
                style={{
                  left: DOT_POS[h.id].left,
                  top: DOT_POS[h.id].top,
                }}
              >
                <NbHotspotDot
                  label={`Explain ${h.label}`}
                  kind={visited.has(h.id) ? "done" : "idle"}
                  onClick={() => toggle(h.id)}
                />
              </button>
            ))}
          </div>
        </NbBox>

        {/* Explanation panel */}
        <NbBox className="bg-secondary p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {open ? "What you're looking at" : "Click a dot to begin"}
          </p>
          {open ? (
            <div className="mt-2">
              <p className="text-lg font-bold uppercase">{open.label}</p>
              <p className="mt-2 text-sm leading-relaxed">{open.short}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {open.long}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Each dot is one ingredient of every website on the internet. Find
              all four to unlock the next step.
            </p>
          )}
        </NbBox>
      </div>

      {/* progress dots */}
      <div className="mt-4 flex items-center gap-2">
        {HOTSPOTS.map((h) => (
          <span
            key={h.id}
            className={cn(
              "nb-border size-3",
              visited.has(h.id) ? "bg-[var(--chart-2)]" : "bg-card",
            )}
          />
        ))}
        <span className="ml-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {visited.size}/{HOTSPOTS.length} ingredients found
        </span>
      </div>

      <div className="mt-8">
        <NbQuiz
          question="Quick check: which ingredient makes a menu open when you tap it?"
          options={[
            { label: "HTML — the skeleton" },
            { label: "CSS — the outfit" },
            { label: "JavaScript — the muscles", correct: true },
            { label: "Content — the words" },
          ]}
          onSolved={onSolved}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <NbButton onClick={onNext}>
          Continue to Step 3 <ArrowRight className="size-4" />
        </NbButton>
      </div>
    </NbSection>
  );
}
