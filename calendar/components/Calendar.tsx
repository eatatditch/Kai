"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent, FilterKey, ViewMode } from "@/types";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";
import { startOfWeek } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { Legend } from "./Legend";

function clampMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function periodLabel(view: ViewMode, cursor: Date): string {
  if (view === "month") {
    return cursor
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase();
  }
  const ws = startOfWeek(cursor);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const sameMonth = ws.getMonth() === we.getMonth();
  const startStr = ws.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = we.toLocaleDateString(
    "en-US",
    sameMonth
      ? { day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
  return `${startStr} — ${endStr}`.toUpperCase();
}

export function Calendar() {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(new Date(2026, 4, 1));
  const [filters, setFilters] = useState<Set<FilterKey>>(
    () => new Set<FilterKey>(["all"]),
  );

  const events = MOCK_EVENTS;

  const visibleEvents = useMemo(() => {
    if (filters.has("all")) return events;
    return events.filter((e) => filters.has(getType(e.type).cat));
  }, [events, filters]);

  const navDisabled = useMemo(() => {
    if (view === "month") {
      const prevTarget = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
      const nextTarget = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      return {
        prev: prevTarget < clampMonth(MIN_DATE),
        next: nextTarget > clampMonth(MAX_DATE),
      };
    }
    const ws = startOfWeek(cursor);
    const prevWeekEnd = new Date(ws);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const nextWeekStart = new Date(ws);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return {
      prev: prevWeekEnd < MIN_DATE,
      next: nextWeekStart > MAX_DATE,
    };
  }, [cursor, view]);

  const navigate = (delta: number) => {
    if (view === "month") {
      const target = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + delta,
        1,
      );
      if (target < clampMonth(MIN_DATE)) return;
      if (target > clampMonth(MAX_DATE)) return;
      setCursor(target);
    } else {
      const ws = startOfWeek(cursor);
      ws.setDate(ws.getDate() + delta * 7);
      setCursor(ws);
    }
  };

  const goToday = () => {
    const today = new Date();
    if (today < MIN_DATE) setCursor(new Date(MIN_DATE));
    else if (today > MAX_DATE) setCursor(new Date(MAX_DATE));
    else setCursor(today);
  };

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (key === "all") return new Set<FilterKey>(["all"]);
      next.delete("all");
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) next.add("all");
      return next;
    });
  };

  const noop = () => {};
  const onDayClick = (_date: string) => {
    void _date;
  };
  const onEventClick = (_ev: CalendarEvent) => {
    void _ev;
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15">
      <Header
        view={view}
        prevDisabled={navDisabled.prev}
        nextDisabled={navDisabled.next}
        onViewChange={setView}
        onPrev={() => navigate(-1)}
        onToday={goToday}
        onNext={() => navigate(1)}
        onPrint={() => window.print()}
        onExport={noop}
        onImport={noop}
        onNewEvent={noop}
      />

      <FilterBar active={filters} onToggle={toggleFilter} />

      <div className="mb-3 px-0 font-bebas text-[32px] tracking-[0.04em] text-navy">
        {periodLabel(view, cursor)}
      </div>

      {view === "month" ? (
        <MonthView
          cursor={cursor}
          events={visibleEvents}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      ) : (
        <WeekView
          cursor={cursor}
          events={visibleEvents}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      )}

      <Legend />

      <p className="mt-5 text-center font-caveat text-base text-muted">
        spread joy. build community. surf well.
      </p>
    </div>
  );
}
