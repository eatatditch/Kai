import type { CalendarEvent } from "@/types";
import { ymd, isSameDay, startOfWeek } from "@/lib/date-utils";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";
import { EventPill } from "./EventPill";

const WEEKDAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const MAX_PILLS = 4;

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

export function MonthView({ cursor, events, onDayClick, onEventClick }: Props) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstOfMonth = new Date(y, m, 1);
  const gridStart = startOfWeek(firstOfMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: React.ReactNode[] = [];
  const cur = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    const isOutside = cur.getMonth() !== m;
    const isToday = isSameDay(cur, today);
    const dateStr = ymd(cur);
    const isOutOfRange = cur < MIN_DATE || cur > MAX_DATE;
    const dayEvents = eventsForDate(events, dateStr);
    const visible = dayEvents.slice(0, MAX_PILLS);
    const overflow = dayEvents.length - visible.length;
    const dayNum = cur.getDate();

    cells.push(
      <div
        key={dateStr}
        data-date={dateStr}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-event-pill]")) return;
          if (isOutOfRange) return;
          onDayClick(dateStr);
        }}
        className={[
          "relative flex min-h-[120px] cursor-pointer flex-col border-b border-r border-line-soft px-[7px] pt-1.5 pb-2 transition-colors duration-[120ms] [&:nth-child(7n)]:border-r-0",
          isToday
            ? "bg-sage-tint hover:bg-[#d6e3d3]"
            : isOutside
              ? "bg-[#faf5e8] hover:bg-[#f5edd5]"
              : "bg-white hover:bg-orange-tint",
        ].join(" ")}
      >
        {isToday ? (
          <span className="mb-1 inline-flex h-6 w-6 items-center justify-center self-start rounded-full bg-orange text-[13px] font-bold text-white">
            {dayNum}
          </span>
        ) : (
          <span
            className={`mb-1 text-[13px] font-semibold ${
              isOutside ? "text-[#b5a78a]" : "text-ink"
            }`}
          >
            {dayNum}
          </span>
        )}

        <div className="flex flex-col gap-[3px] overflow-hidden">
          {visible.map((ev) => (
            <div key={ev.id} data-event-pill>
              <EventPill event={ev} onClick={onEventClick} />
            </div>
          ))}
          {overflow > 0 && (
            <button
              type="button"
              data-event-pill
              onClick={(e) => {
                e.stopPropagation();
                onDayClick(dateStr);
              }}
              className="mt-0.5 self-start text-[10px] font-semibold text-muted hover:text-orange"
            >
              + {overflow} more
            </button>
          )}
        </div>
      </div>,
    );

    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div className="overflow-hidden rounded-[10px] border-[1.5px] border-ink bg-white shadow-card">
      <div className="grid grid-cols-7 bg-navy">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-r border-white/10 px-3 py-2.5 text-center font-bebas text-[15px] tracking-[0.12em] text-cream last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{cells}</div>
    </div>
  );
}
