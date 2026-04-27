"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent, Recurrence } from "@/types";
import { EVENT_TYPES, getType } from "@/lib/event-types";
import { MIN_DATE, MAX_DATE } from "@/lib/constants";
import { ymd, parseYmd, formatTime } from "@/lib/date-utils";
import {
  RECURRENCE_OPTIONS,
  generateOccurrenceDates,
} from "@/lib/recurrence";

type Props = {
  date: string;
  initialEvent: CalendarEvent | null;
  events: CalendarEvent[];
  onClose: () => void;
  onSave: (event: CalendarEvent, recurrence: Recurrence) => void;
  onDelete: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onCancelEdit: () => void;
};

const MIN_YMD = ymd(MIN_DATE);
const MAX_YMD = ymd(MAX_DATE);

function uid(): string {
  return crypto.randomUUID();
}

function sortEvents(list: CalendarEvent[]): CalendarEvent[] {
  return [...list].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });
}

export function EventModal({
  date,
  initialEvent,
  events,
  onClose,
  onSave,
  onDelete,
  onEdit,
  onCancelEdit,
}: Props) {
  const [type, setType] = useState(initialEvent?.type ?? EVENT_TYPES[0].id);
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [formDate, setFormDate] = useState(initialEvent?.date ?? date);
  const [time, setTime] = useState(initialEvent?.time ?? "");
  const [notes, setNotes] = useState(initialEvent?.notes ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const dayEvents = useMemo(
    () => sortEvents(events.filter((e) => e.date === date)),
    [events, date],
  );

  const dayLabel = parseYmd(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isEdit = initialEvent !== null;

  const occurrenceCount = useMemo(() => {
    if (isEdit || recurrence === "none") return 1;
    return generateOccurrenceDates(formDate, recurrence).length;
  }, [isEdit, recurrence, formDate]);

  const handleSave = () => {
    const d = parseYmd(formDate);
    if (d < MIN_DATE || d > MAX_DATE) return;
    const t = getType(type);
    const finalTitle = title.trim() || t.label;
    const ev: CalendarEvent = {
      id: initialEvent?.id ?? uid(),
      date: formDate,
      type,
      title: finalTitle,
      time: time || undefined,
      notes: notes.trim() || undefined,
    };
    onSave(ev, isEdit ? "none" : recurrence);
  };

  const handleDelete = (ev: CalendarEvent) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    onDelete(ev.id);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(31,42,48,0.6)] p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="motion-safe:animate-pop max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[10px] border-2 border-ink bg-cream shadow-pop"
      >
        <div className="flex items-center justify-between border-b-[1.5px] border-ink bg-navy px-5 py-4 text-cream">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-orange-soft">
              {dayLabel}
            </div>
            <h3 className="m-0 font-bebas text-[22px] tracking-[0.04em]">
              Schedule Event
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-[1.5px] border-cream bg-transparent text-base leading-none text-cream hover:border-orange hover:bg-orange"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          {dayEvents.length > 0 && (
            <div className="mb-5">
              <h4 className="m-0 mb-2.5 font-bebas text-[15px] tracking-[0.12em] text-muted">
                SCHEDULED THIS DAY
              </h4>
              <div className="flex flex-col gap-2">
                {dayEvents.map((ev) => {
                  const t = getType(ev.type);
                  const meta = `${ev.time ? `${formatTime(ev.time)} · ` : ""}${t.label}`;
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2.5 rounded-sm border border-line bg-white px-3 py-2"
                    >
                      <div className="text-lg leading-none">{t.emoji}</div>
                      <div className="flex-1 overflow-hidden">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-ink">
                          {ev.title}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                          {meta}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Edit"
                          title="Edit"
                          onClick={() => onEdit(ev)}
                          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded border border-line bg-transparent text-xs text-muted hover:bg-sand hover:text-ink"
                        >
                          ✏
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          title="Delete"
                          onClick={() => handleDelete(ev)}
                          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded border border-line bg-transparent text-xs text-muted hover:border-cat-event hover:bg-[#f3d5cc] hover:text-[#8a2c10]"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={`pt-[18px] ${dayEvents.length > 0 ? "border-t border-dashed border-line" : ""}`}
          >
            <h4 className="m-0 mb-3.5 font-bebas text-base tracking-[0.1em] text-navy">
              {isEdit ? "EDIT EVENT" : "ADD NEW EVENT"}
            </h4>

            <div className="mb-3.5">
              <label
                htmlFor="event-type"
                className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
              >
                Event Type
              </label>
              <select
                id="event-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji}  {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3.5">
              <label
                htmlFor="event-title"
                className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
              >
                Title
              </label>
              <input
                ref={titleRef}
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Burger Night recap reel"
                className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
              />
            </div>

            <div className="mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-date"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
                >
                  Date
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={formDate}
                  min={MIN_YMD}
                  max={MAX_YMD}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
                />
              </div>
              <div>
                <label
                  htmlFor="event-time"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
                >
                  Time (optional)
                </label>
                <input
                  id="event-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
                />
              </div>
            </div>

            {!isEdit && (
              <div className="mb-3.5">
                <label
                  htmlFor="event-recurrence"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
                >
                  Repeat
                </label>
                <select
                  id="event-recurrence"
                  value={recurrence}
                  onChange={(e) =>
                    setRecurrence(e.target.value as Recurrence)
                  }
                  className="w-full rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
                >
                  {RECURRENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {recurrence !== "none" && (
                  <p className="mt-1 text-[11px] text-muted">
                    Will create {occurrenceCount} event
                    {occurrenceCount === 1 ? "" : "s"} (capped at 500
                    occurrences).
                  </p>
                )}
              </div>
            )}

            <div className="mb-3.5">
              <label
                htmlFor="event-notes"
                className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
              >
                Notes / Details
              </label>
              <textarea
                id="event-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Caption draft, location, talent, links..."
                className="min-h-[60px] w-full resize-y rounded-sm border-[1.5px] border-line bg-white px-3 py-2.5 text-sm text-ink transition-colors duration-150 focus:border-orange focus:outline-none focus:ring-[3px] focus:ring-orange/15"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1.5">
              {isEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-sm border-[1.5px] border-ink bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors duration-150 hover:bg-sand"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-sm border-[1.5px] border-orange bg-orange px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 hover:border-[#b8541f] hover:bg-[#b8541f]"
              >
                {isEdit ? "Update Event" : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
