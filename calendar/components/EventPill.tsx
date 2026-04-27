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
  onClick?: (event: CalendarEvent) => void;
};

export function EventPill({ event, onClick }: Props) {
  const type = getType(event.type);
  const title = event.title || type.label;

  return (
    <button
      type="button"
      title={`${type.label}: ${event.title}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className={`flex w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded-pill border-l-[3px] px-1.5 py-[3px] text-left text-[11px] font-medium leading-[1.25] text-ink transition-transform duration-100 hover:translate-x-0.5 ${CAT_CLASSES[type.cat]}`}
    >
      <span className="text-[11px] leading-none">{type.emoji}</span>
      <span className="overflow-hidden text-ellipsis">{title}</span>
    </button>
  );
}
