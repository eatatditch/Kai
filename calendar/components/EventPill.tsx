import type { Category, CalendarEvent } from "@/types";
import { getType } from "@/lib/event-types";

const CAT_CLASSES: Record<Category, string> = {
  shoot:   "bg-orange-tint border-l-orange",
  social:  "bg-navy-tint border-l-navy",
  comms:   "bg-sage-tint border-l-sage",
  event:   "bg-[#fbe5d4] border-l-cat-event",
  meeting: "bg-[#ede4f4] border-l-cat-meeting",
  other:   "bg-[#e8e8e0] border-l-muted",
};

type Props = {
  event: CalendarEvent;
  hasScript?: boolean;
  onClick?: (event: CalendarEvent) => void;
};

export function EventPill({ event, hasScript = false, onClick }: Props) {
  const type = getType(event.type);
  const title = event.title || type.label;
  const hint = `${type.label}: ${event.title}${hasScript ? " · script attached" : ""}`;

  return (
    <button
      type="button"
      title={hint}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className={`flex w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded-pill border-l-[3px] px-1.5 py-[3px] text-left text-[11px] font-medium leading-[1.25] text-ink transition-transform duration-100 hover:translate-x-0.5 print:gap-0.5 print:rounded-none print:border print:border-[#888] print:px-1 print:py-0 print:text-[8px] print:leading-[1.2] print:text-black print:bg-white ${CAT_CLASSES[type.cat]}`}
    >
      <span className="text-[11px] leading-none">{type.emoji}</span>
      <span className="overflow-hidden text-ellipsis">{title}</span>
      {hasScript && (
        <span
          className="ml-auto shrink-0 text-[9px] leading-none print:hidden"
          aria-label="Has attached script"
        >
          📝
        </span>
      )}
    </button>
  );
}
