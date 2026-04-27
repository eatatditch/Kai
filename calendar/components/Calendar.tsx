"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent, FilterKey, ViewMode } from "@/types";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";
import { startOfWeek, ymd } from "@/lib/date-utils";
import { getType } from "@/lib/event-types";
import {
  fetchEvents,
  upsertEvent,
  deleteEventById,
  subscribeEvents,
} from "@/lib/events-api";
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { Legend } from "./Legend";
import { EventModal } from "./EventModal";
import { Toast } from "./Toast";

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

type ModalState = { date: string; editId: string | null } | null;

type Props = {
  userEmail: string;
};

export function Calendar({ userEmail }: Props) {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(new Date(2026, 4, 1));
  const [filters, setFilters] = useState<Set<FilterKey>>(
    () => new Set<FilterKey>(["all"]),
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchEvents()
      .then((rows) => {
        if (active) setEvents(rows);
      })
      .catch(() => {
        if (active) showToast("Failed to load events");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = subscribeEvents((change) => {
      if (change.kind === "upsert") {
        const incoming = change.event;
        setEvents((prev) => {
          const idx = prev.findIndex((e) => e.id === incoming.id);
          if (idx === -1) return [...prev, incoming];
          const next = prev.slice();
          next[idx] = incoming;
          return next;
        });
      } else {
        setEvents((prev) => prev.filter((e) => e.id !== change.id));
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

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

  const onDayClick = (date: string) => setModal({ date, editId: null });
  const onEventClick = (ev: CalendarEvent) =>
    setModal({ date: ev.date, editId: ev.id });

  const onNewEvent = () => {
    const today = new Date();
    const target = today < MIN_DATE || today > MAX_DATE ? MIN_DATE : today;
    setModal({ date: ymd(target), editId: null });
  };

  const onSaveEvent = (ev: CalendarEvent) => {
    const isUpdate = events.some((e) => e.id === ev.id);
    const snapshot = events;
    setEvents((prev) =>
      isUpdate
        ? prev.map((e) => (e.id === ev.id ? ev : e))
        : [...prev, ev],
    );
    setModal((prev) => (prev ? { date: ev.date, editId: null } : prev));

    upsertEvent(ev)
      .then((saved) => {
        setEvents((prev) =>
          prev.map((e) => (e.id === saved.id ? saved : e)),
        );
        showToast(isUpdate ? "Event updated" : "Event added");
      })
      .catch(() => {
        setEvents(snapshot);
        showToast("Save failed — changes rolled back");
      });
  };

  const onDeleteEvent = (id: string) => {
    const snapshot = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setModal((prev) =>
      prev && prev.editId === id ? { date: prev.date, editId: null } : prev,
    );

    deleteEventById(id)
      .then(() => showToast("Event deleted"))
      .catch(() => {
        setEvents(snapshot);
        showToast("Delete failed — restored");
      });
  };

  const onEditEvent = (ev: CalendarEvent) =>
    setModal({ date: ev.date, editId: ev.id });

  const onCancelEdit = () =>
    setModal((prev) => (prev ? { date: prev.date, editId: null } : prev));

  const editingEvent =
    modal && modal.editId
      ? events.find((e) => e.id === modal.editId) ?? null
      : null;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-15">
      <Header
        view={view}
        prevDisabled={navDisabled.prev}
        nextDisabled={navDisabled.next}
        userEmail={userEmail}
        onViewChange={setView}
        onPrev={() => navigate(-1)}
        onToday={goToday}
        onNext={() => navigate(1)}
        onPrint={() => window.print()}
        onExport={() => {}}
        onImport={() => {}}
        onNewEvent={onNewEvent}
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

      {modal && (
        <EventModal
          key={`${modal.date}-${modal.editId ?? "new"}`}
          date={modal.date}
          initialEvent={editingEvent}
          events={events}
          onClose={() => setModal(null)}
          onSave={onSaveEvent}
          onDelete={onDeleteEvent}
          onEdit={onEditEvent}
          onCancelEdit={onCancelEdit}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
