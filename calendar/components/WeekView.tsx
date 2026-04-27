import type { CalendarEvent, Category } from "@/types";
import { ymd, isSameDay, startOfWeek, formatTime } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";

const CAT_CLASSES: Record<Category, string> = {
  shoot:   "bg-orange-tint border-l-orange",
  social:  "bg-navy-tint border-l-navy",
  comms:   "bg-sage-tint border-l-sage",
  event:   "bg-[#fbe5d4] border-l-cat-event",
  meeting: "bg-[#ede4f4] border-l-cat-meeting",
  other:   "bg-[#e8e8e0] border-l-muted",
};

type Props = {
  cursor: Date;
  events: CalendarEvent[];
  onDayClick: (dateStr: string) => void;
  onEventClick: (event: CalendarEvent) => void;
};

function eventsForDate(all: CalendarEvent[], dateStr: string): CalendarEvent[] {
  const list = all.filter((e) => e.date === dateStr);
  list.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });
  return list;
}

export function WeekView({ cursor, events, onDayClick, onEventClick }: Props) {
  const ws = startOfWeek(cursor);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws);
    d.setDate(ws.getDate() + i);
    const dateStr = ymd(d);
    const isToday = isSameDay(d, today);
    const isOutOfRange = d < MIN_DATE || d > MAX_DATE;
    const dayName = d
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const dayEvents = eventsForDate(events, dateStr);

    days.push(
      <div
        key={dateStr}
        data-date={dateStr}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-event-pill]")) return;
          if (isOutOfRange) return;
          onDayClick(dateStr);
        }}
        className={[
          "flex min-h-[380px] cursor-pointer flex-col border-r border-line-soft px-2.5 pt-2.5 pb-3 transition-colors duration-[120ms] last:border-r-0 print:min-h-[200px] print:break-inside-avoid",
          isToday
            ? "bg-sage-tint hover:bg-[#d6e3d3] print:bg-white"
            : "bg-white hover:bg-orange-tint",
          isOutOfRange ? "cursor-not-allowed opacity-40" : "",
        ].join(" ")}
      >
        <div className="mb-2 flex items-baseline gap-2 border-b border-line-soft pb-2">
          <span className="font-bebas text-sm tracking-[0.12em] text-muted">
            {dayName}
          </span>
          <span
            className={`font-bebas text-[22px] leading-none ${
              isToday ? "text-orange" : "text-navy"
            }`}
          >
            {d.getDate()}
          </span>
        </div>
        <div className="flex flex-col gap-[5px]">
          {dayEvents.map((ev) => {
            const t = getType(ev.type);
            const title = ev.title || t.label;
            const timeStr = ev.time ? formatTime(ev.time) : t.label;
            return (
              <button
                key={ev.id}
                type="button"
                data-event-pill
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(ev);
                }}
                className={`rounded-sm border-l-[3px] px-2 py-1.5 text-left leading-[1.3] print:rounded-none print:border print:border-[#888] print:bg-white print:text-black ${CAT_CLASSES[t.cat]}`}
              >
                <div className="mb-0.5 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-muted">
                  {t.emoji} {timeStr}
                </div>
                <div className="text-xs font-semibold text-ink">{title}</div>
              </button>
            );
          })}
        </div>
      </div>,
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border-[1.5px] border-ink bg-white shadow-card print:break-inside-avoid print:rounded-none print:border print:border-black print:shadow-none">
      <div className="grid grid-cols-7">{days}</div>
    </div>
  );
}
