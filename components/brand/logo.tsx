import { cn } from "@/lib/utils";

/**
 * Placeholder Ditch wordmark. Replace with the finalized logotype once the
 * retro surf design pass lands.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-xl font-bold tracking-tight text-ditch-ink",
        className,
      )}
    >
      Ditch
      <span className="text-ditch-rust">.</span>
    </span>
  );
}
