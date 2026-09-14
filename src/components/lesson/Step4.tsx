/**
 * Step 4 — Build a café website with AI (the must-have interactive demo).
 * Learner picks a vibe, a color, and writes a one-line prompt, then watches
 * a mini site assemble live. "Regenerate" shows how AI iterates.
 */
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  NbBox,
  NbButton,
  NbDisclosure,
  NbQuiz,
  NbSection,
  NbTag,
} from "@/components/nb";
import { cn } from "@/lib/utils";

type Vibe = "minimal" | "bold" | "cozy";

const VIBES: { id: Vibe; label: string; emoji: string }[] = [
  { id: "minimal", label: "Minimal", emoji: "◻️" },
  { id: "bold", label: "Bold", emoji: "🟥" },
  { id: "cozy", label: "Cozy", emoji: "🧸" },
];

const COLORS: { id: string; name: string; bg: string }[] = [
  { id: "amber", name: "Amber", bg: "#fbbf24" },
  { id: "teal", name: "Teal", bg: "#2dd4bf" },
  { id: "coral", name: "Coral", bg: "#fb7185" },
  { id: "lime", name: "Lime", bg: "#a3e635" },
  { id: "cream", name: "Cream", bg: "#f5f0e6" },
];

interface Built {
  title: string;
  tagline: string;
  items: [string, string][];
}

function buildSite(vibe: Vibe, prompt: string, gen: number): Built {
  const p = prompt.trim() || "a friendly café website";

  const titles: Record<Vibe, string> = {
    minimal: "The Corner Café",
    bold: "CORNER CAFÉ",
    cozy: "Corner Café 🧸",
  };
  const taglines: Record<Vibe, string> = {
    minimal: "Coffee. Quiet. Clarity.",
    bold: "LOUD COFFEE. BIG ENERGY.",
    cozy: "Like a warm hug in a mug.",
  };
  const items: Record<Vibe, [string, string][]> = {
    minimal: [
      ["Espresso", "$3.00"],
      ["Filter", "$3.20"],
      ["Water", "free"],
    ],
    bold: [
      ["MEGA LATTE", "$4.50"],
      ["TURBO MOCHA", "$5.00"],
      ["NITRO COLD BREW", "$5.50"],
    ],
    cozy: [
      ["Grandma's cocoa", "$3.80"],
      ["Cinnamon bun", "$2.90"],
      ["Honey latte", "$4.10"],
    ],
  };

  const flavored = gen > 0 ? `v${gen + 1}` : "";

  return {
    title: `${titles[vibe]} ${flavored}`.trim(),
    tagline: taglines[vibe],
    items: items[vibe].map(([n, pr], i) => [
      i === 0 && prompt ? `${n} — "${p.slice(0, 24)}${p.length > 24 ? "…"
        : ""}"` : n,
      pr,
    ]),
  };
}

export function Step4({
  onSolved,
  onFinish,
}: {
  onSolved: () => void;
  onFinish: () => void;
}) {
  const [vibe, setVibe] = useState<Vibe>("minimal");
  const [color, setColor] = useState("amber");
  const [prompt, setPrompt] = useState("a café site for my neighborhood");
  const [gen, setGen] = useState(0);
  const [built, setBuilt] = useState<Built | null>(null);
  const [assembling, setAssembling] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const generate = () => {
    if (assembling) return;
    setAssembling(true);
    onSolved();
    timer.current = window.setTimeout(() => {
      setBuilt(buildSite(vibe, prompt, gen));
      setAssembling(false);
      setGen((g) => g + 1);
    }, 1400);
  };

  const colorDef = COLORS.find((c) => c.id === color) ?? COLORS[0];

  return (
    <NbSection className="py-8">
      <div className="flex flex-wrap items-center gap-2">
        <NbTag>Step 4 of 4</NbTag>
        <NbTag className="bg-[var(--chart-2)]">Your turn</NbTag>
      </div>

      <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight">
        Build a café site with AI
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        You&apos;re the boss now. Choose a vibe and color, describe your café,
        then hit <Sparkles className="inline size-4" /> Generate. Watch it
        assemble — then regenerate to see AI iterate.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Control panel */}
        <NbBox className="bg-secondary p-4">
          <p className="text-xs font-bold uppercase tracking-widest">1. Pick a vibe</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className={cn(
                  "nb-border nb-press bg-background px-2 py-2 text-xs font-bold uppercase",
                  vibe === v.id && "bg-accent",
                )}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-widest">2. Pick a color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                aria-label={`Pick ${c.name}`}
                className={cn(
                  "nb-border size-9",
                  color === c.id && "ring-2 ring-border ring-offset-2 ring-offset-secondary",
                )}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-widest">3. Describe your café</p>
          <textarea
            className="nb-border mt-2 w-full bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-[var(--chart-3)]"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="a cozy café by the river with late-night hours"
          />
          <div className="mt-3 flex gap-2">
            <NbButton onClick={generate} disabled={assembling} className="flex-1">
              <Sparkles className="size-4" />
              {assembling ? "AI working…" : built ? "Regenerate" : "Generate"}
            </NbButton>
            <NbButton
              variant="ghost"
              onClick={() => {
                setBuilt(null);
                setGen(0);
              }}
              disabled={assembling}
            >
              <RotateCcw className="size-4" />
            </NbButton>
          </div>
        </NbBox>

        {/* Preview panel */}
        <div>
          <NbBox className="bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest">
                Your site
              </p>
              {built && (
                <NbTag className="bg-[var(--chart-2)]">
                  Generation {gen}
                </NbTag>
              )}
            </div>

            {!built && !assembling && (
              <div className="nb-border mt-3 flex min-h-[260px] items-center justify-center bg-background p-6">
                <p className="text-center text-sm text-muted-foreground">
                  Your café site will appear here.
                  <br />
                  Set your choices and press Generate.
                </p>
              </div>
            )}

            {assembling && (
              <div className="nb-border mt-3 min-h-[260px] bg-background p-4">
                <div className="space-y-2 font-mono text-xs">
                  <p>→ reading your wish ({prompt.trim().split(/\s+/).filter(Boolean).length} words read)</p>
                  <p>→ sketching the <strong>{vibe}</strong> layout</p>
                  <p>→ writing the skeleton (index.html)…<span className="nb-caret" /></p>
                  <p>→ adding the muscles (app.js)…<span className="nb-caret" /></p>
                  <p>→ painting in <span className="nb-code">{colorDef.name}</span></p>
                </div>
                <div className="mt-3 flex gap-1">
                  <span className="nb-border bg-background px-2 py-1 text-[10px] font-bold uppercase">vibe: {vibe}</span>
                  <span className="nb-border bg-background px-2 py-1 text-[10px] font-bold uppercase">color: {colorDef.name}</span>
                </div>
              </div>
            )}

            {built && !assembling && (
              <div className="nb-border mt-3 bg-background" style={{ backgroundColor: colorDef.bg }}>
                {/* mini site */}
                <div className="nb-border-4 bg-card">
                  <div className="nb-border bg-accent px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest">
                      ☕ {built.title}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className={cn(
                      "font-bold uppercase",
                      vibe === "bold" ? "text-2xl" : "text-xl",
                    )}>
                      {built.tagline}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {built.items.map(([n, pr]) => (
                        <div key={n} className="nb-border flex items-center justify-between bg-background px-2 py-1.5">
                          <span className="text-xs font-medium">{n}</span>
                          <span className="font-mono text-xs font-bold">{pr}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {["Menu", "Find us", "About"].map((t) => (
                        <div key={t} className="nb-border bg-secondary px-2 py-1.5 text-center text-[10px] font-bold uppercase">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </NbBox>
        </div>
      </div>

      {/* Reflection prompts */}
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <NbDisclosure title="What just happened?">
          You gave the AI three things: a vibe, a color, and words. The AI
          turned them into the same three ingredients from Step 2 — skeleton
          (HTML), outfit (CSS), muscles (JS). You directed; it executed.
        </NbDisclosure>
        <NbDisclosure title="What could you build next?">
          Anything with a purpose: a portfolio, a club page, a shop. The skill
          you just practiced — describing clearly, judging the result, giving
          better feedback — is the real skill of building with AI.
        </NbDisclosure>
      </div>

      <div className="mt-8">
        <NbQuiz
          question="Quick check: you generated a site and the color feels wrong. What do you do?"
          options={[
            { label: "Give up — AI built it, so it's final" },
            { label: "Regenerate with clearer instructions", correct: true },
            { label: "Blame the AI and close the tab" },
          ]}
          onSolved={onSolved}
        />
      </div>

      <div className="mt-8 flex flex-col items-end gap-2">
        <NbButton variant="success" onClick={onFinish} disabled={!built}>
          Finish lesson 🏁
        </NbButton>
        {!built && (
          <p className="text-xs text-muted-foreground">
            Generate a site to finish the lesson.
          </p>
        )}
      </div>
    </NbSection>
  );
}
