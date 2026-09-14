/**
 * SectionActivity — renders the right interactive game for a section and
 * wires it to the player: confetti burst on first solve, then a lock so the
 * challenge stays genuinely interactive on every visit.
 *
 * All game dispatching is owned here. The player passes `solvedAtMount` so
 * re-visits skip the gate but keep the replayable play state. Pass no
 * `onSolved` in read-only contexts (e.g. the catalog free preview): the game
 * still plays and celebrates locally, nothing is written to progress.
 */
import { useRef, useState } from "react";
import { PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import { NbQuiz } from "@/components/nb";
import { NbConfetti } from "./NbConfetti";
import { NbChecklistGame } from "./NbChecklistGame";
import { NbMatchGame, NbOrderGame } from "./games";
import {
  NbGrowSiteGame,
  NbPickBestGame,
  NbPromptBuilderGame,
  NbVibeSwitcherGame,
} from "./games2";
import { NbSpotTheDifferenceGame } from "./NbSpotTheDifferenceGame";
import type { Interactive } from "@/convex/moduleContent";

export function SectionActivity({
  slug,
  sectionIndex,
  interactive,
  onSolved,
  solvedAtMount,
}: {
  slug: string;
  sectionIndex: number;
  interactive: Interactive;
  onSolved?: () => void;
  solvedAtMount: boolean;
}) {
  const [burstKey, setBurstKey] = useState(0);
  const [solvedThisSession, setSolvedThisSession] = useState(solvedAtMount);
  const firedRef = useRef(false);

  // Re-solvable: a fresh challenge resets local solve state, and a previously
  // solved challenge still shows its "solved" banner but stays playable.
  // Adjusted during render when the section changes — the React-endorsed
  // pattern for resetting state when a prop changes (no effect cascade).
  const [seenKey, setSeenKey] = useState(`${slug}:${sectionIndex}`);
  if (`${slug}:${sectionIndex}` !== seenKey) {
    setSeenKey(`${slug}:${sectionIndex}`);
    setSolvedThisSession(solvedAtMount);
  }

  const handleSolved = () => {
    if (!firedRef.current) {
      firedRef.current = true;
      setBurstKey((k) => k + 1);
    }
    setSolvedThisSession(true);
    onSolved?.();
  };

  return (
    <div className="relative">
      <NbConfetti burstKey={burstKey} />
      <motion.div
        key={burstKey}
        initial={false}
        animate={burstKey > 0 ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.35 }}
        className={cnFlash(solvedThisSession)}
      >
        {solvedThisSession && (
          <p className="nb-border mb-3 flex items-center gap-2 bg-[var(--chart-2)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
            <PartyPopper className="size-3.5 nb-wiggle" /> Nice — challenge
            solved
          </p>
        )}

        {interactive.kind === "order" && (
          <NbOrderGame
            prompt={interactive.prompt}
            items={interactive.items}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "match" && (
          <NbMatchGame
            prompt={interactive.prompt}
            pairs={interactive.pairs}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "pick-best" && (
          <NbPickBestGame
            prompt={interactive.prompt}
            options={interactive.options}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "grow-site" && (
          <NbGrowSiteGame
            prompt={interactive.prompt}
            candidates={interactive.candidates}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "prompt-builder" && (
          <NbPromptBuilderGame
            prompt={interactive.prompt}
            fragments={interactive.fragments}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "vibe-switcher" && (
          <NbVibeSwitcherGame
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "checklist" && (
          <NbChecklistGame
            prompt={interactive.prompt}
            items={interactive.items}
            mustSelect={interactive.mustSelect}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
        {interactive.kind === "quiz" && (
          <NbQuiz
            question={interactive.prompt}
            options={interactive.options}
            onSolved={handleSolved}
          />
        )}
        {interactive.kind === "spot-the-difference" && (
          <NbSpotTheDifferenceGame
            prompt={interactive.prompt}
            badDocument={interactive.badDocument}
            fixes={interactive.fixes}
            onSolved={handleSolved}
            solvedText={interactive.solvedText}
          />
        )}
      </motion.div>
    </div>
  );
}

function cnFlash(solved: boolean): string {
  return solved ? "nb-solved-flash" : "";
}
