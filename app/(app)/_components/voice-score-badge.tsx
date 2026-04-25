import { cn } from "@/lib/utils";

export function VoiceScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tier =
    score >= 90
      ? "ship"
      : score >= 75
        ? "tweak"
        : score >= 60
          ? "rework"
          : "rewrite";

  const styles = {
    ship: "bg-primary text-primary-foreground",
    tweak: "bg-accent text-accent-foreground",
    rework: "bg-secondary text-secondary-foreground",
    rewrite: "bg-destructive text-destructive-foreground",
  } as const;

  const label = {
    ship: "Ships as-is",
    tweak: "Small tweaks",
    rework: "Needs work",
    rewrite: "Rewrite",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        styles[tier],
        className,
      )}
    >
      <span className="font-mono text-sm">{score}</span>
      <span className="uppercase tracking-wider">{label[tier]}</span>
    </span>
  );
}
