/**
 * NbConfetti — a tiny CSS-only confetti burst. Renders ~24 absolutely
 * positioned pieces that fly outward, spin, and fade. Pure CSS animation,
 * no library weight. Re-mount to replay (keyed by `burstKey`).
 */
import { cn } from "@/lib/utils";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--accent)",
];

export function NbConfetti({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) return null;
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 + (burstKey % 7) * 0.3;
    const dist = 50 + ((i * 37 + burstKey * 13) % 55);
    return {
      left: 50 + Math.cos(angle) * 6,
      top: 50 + Math.sin(angle) * 6,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist + 30,
      rot: ((i * 53) % 360) + 180,
      dur: 0.7 + ((i * 7 + burstKey) % 6) / 10,
      size: 6 + (i % 3) * 4,
      color: COLORS[i % COLORS.length],
      round: i % 3 === 1,
    };
  });

  return (
    <div
      key={burstKey}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className={cn("nb-confetti-piece", p.round && "rounded-full")}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.55,
              background: p.color,
              "--nb-dx": `${p.dx}px`,
              "--nb-dy": `${p.dy}px`,
              "--nb-rot-f": `${p.rot}deg`,
              "--nb-dur": `${p.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
