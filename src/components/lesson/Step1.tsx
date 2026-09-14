/**
 * Step 1 — What is a website?
 * Real-life analogy: ordering food at a café. Browser = you, server = kitchen,
 * files = the dish. Learner clicks through a simulated browser journey.
 */
import { useState } from "react";
import { ArrowLeft, ArrowRight, ChefHat } from "lucide-react";
import { BrowserSim, type BrowserSimStep } from "@/components/BrowserSim";
import { cn } from "@/lib/utils";
import {
  NbBox,
  NbButton,
  NbDisclosure,
  NbQuiz,
  NbSection,
  NbTag,
} from "@/components/nb";

/* Fake "pages" the simulated café site shows, one per beat of the story. */
function CafeHomepage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="nb-border bg-accent px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-widest">
          ☕ The Corner Café — best coffee in town
        </p>
      </div>
      <div className="nb-border mt-2 bg-card p-3">
        <p className="text-sm font-bold uppercase">Welcome in!</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Fresh pastries daily. Open 7am–6pm.
        </p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {["Menu", "Find us", "About"].map((t) => (
          <div key={t} className="nb-border bg-secondary px-2 py-1.5 text-center text-[10px] font-bold uppercase">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function CafeMenuPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="nb-border bg-accent px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-widest">
          ☕ The Corner Café — Menu
        </p>
      </div>
      {[
        ["Latte", "$3.50"],
        ["Flat white", "$3.80"],
        ["Croissant", "$2.90"],
      ].map(([item, price]) => (
        <div key={item} className="nb-border mt-2 flex items-center justify-between bg-card px-3 py-1.5">
          <span className="text-sm font-medium">{item}</span>
          <span className="font-mono text-xs font-bold">{price}</span>
        </div>
      ))}
    </div>
  );
}

export function Step1({
  onNext,
  onSolved,
}: {
  onNext: () => void;
  onSolved: () => void;
}) {
  const [beat, setBeat] = useState(0);

  const steps: BrowserSimStep[] = [
    {
      url: "www.cornercafe.com",
      caption:
        "Imagine you type www.cornercafe.com and press Enter. Your browser is the messenger...",
      body: <CafeHomepage />,
    },
    {
      url: "www.cornercafe.com",
      caption:
        "Your browser (Chrome, Safari...) is the messenger. It shouts your request across the internet.",
      body: <CafeHomepage />,
    },
    {
      url: "www.cornercafe.com",
      caption:
        "The server — a computer that never sleeps — hears it, grabs the right files, and sends them back.",
      body: <CafeMenuPage />,
    },
    {
      url: "www.cornercafe.com",
      caption:
        "Your browser paints the result on screen. That's a website: files sent from a server, drawn by your browser.",
      body: <CafeMenuPage />,
    },
  ];

  return (
    <NbSection className="py-8">
      <div className="flex flex-wrap items-center gap-2">
        <NbTag>Step 1 of 4</NbTag>
        <NbTag className="bg-[var(--chart-4)]">Real-life analogy</NbTag>
      </div>

      <h2 className="mt-4 text-3xl font-bold uppercase tracking-tight">
        What is a website, really?
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        A website is not magic — it&apos;s a conversation between two things:
        your <strong className="text-foreground">browser</strong> (what you see)
        and a <strong className="text-foreground">server</strong> (a computer
        far away). Let&apos;s watch it happen in a fake browser.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        <BrowserSim steps={steps} stepIndex={beat} />

        {/* Café analogy card */}
        <NbBox className="bg-secondary p-4">
          <div className="flex items-center gap-2">
            <ChefHat className="size-5" />
            <p className="text-sm font-bold uppercase">The café analogy</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["🧑 You", "the visitor who types the address"],
              ["🖥️ Browser", "your messenger — asks, then paints"],
              ["🏭 Server", "the café kitchen — holds all the files"],
              ["📄 Files", "the dish that gets served to you"],
            ].map(([k, v]) => (
              <li key={k} className="nb-border bg-background px-2 py-1.5">
                <span className="font-bold">{k}</span> — {v}
              </li>
            ))}
          </ul>
        </NbBox>
      </div>

      {/* Step controls */}
      <div className="mt-4 flex items-center justify-between">
        <NbButton variant="ghost" onClick={() => setBeat(Math.max(0, beat - 1))} disabled={beat === 0}>
          <ArrowLeft className="size-4" /> Back
        </NbButton>
        <div className="flex items-center gap-1.5" aria-label={`Beat ${beat + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "nb-border size-3",
                i === beat ? "bg-accent" : "bg-card",
              )}
            />
          ))}
        </div>
        <NbButton
          onClick={() => {
            if (beat < steps.length - 1) setBeat(beat + 1);
            else onSolved();
          }}
        >
          {beat < steps.length - 1 ? (
            <>
              Next <ArrowRight className="size-4" />
            </>
          ) : (
            "Got it!"
          )}
        </NbButton>
      </div>

      {/* Mini quiz to earn the step */}
      <div className="mt-8">
        <NbQuiz
          question="Quick check: when you open a website, which one paints the picture on your screen?"
          options={[
            { label: "🖥️ The browser on your device", correct: true },
            { label: "🏭 The faraway server" },
            { label: "📶 The Wi-Fi router" },
            { label: "🧑 The website's owner" },
          ]}
          onSolved={onSolved}
        />
      </div>

      <div className="mt-6 space-y-2">
        <NbDisclosure title="Why does this matter when using AI?">
          When you ask AI to build you a website, AI produces the files that
          live on the server. Knowing who serves them and who paints them helps
          you describe what you want — and spot when something looks broken.
        </NbDisclosure>
        <NbDisclosure title="Can I watch the journey again?">
          Absolutely — replay the 4 beats as many times as you like with the
          Back and Next buttons. Repetition is how non-technical brains build
          intuition.
        </NbDisclosure>
      </div>

      <div className="mt-8 flex justify-end">
        <NbButton onClick={onNext}>
          Continue to Step 2 <ArrowRight className="size-4" />
        </NbButton>
      </div>
    </NbSection>
  );
}
