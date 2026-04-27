import type { CalendarEvent, Recurrence } from "@/types";
import { ymd, parseYmd } from "@/lib/date-utils";
import { MAX_DATE } from "@/lib/constants";

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none",            label: "Does not repeat" },
  { value: "daily",           label: "Daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly",          label: "Weekly" },
  { value: "monthly",         label: "Monthly" },
  { value: "quarterly",       label: "Quarterly" },
  { value: "yearly",          label: "Yearly" },
];

const MAX_OCCURRENCES = 500;

function addMonthsPreservingDay(start: Date, monthsToAdd: number): Date {
  const targetMonth = start.getMonth() + monthsToAdd;
  const targetYear = start.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const day = Math.min(start.getDate(), lastDay);
  return new Date(targetYear, normalizedMonth, day);
}

export function generateOccurrenceDates(
  startYmd: string,
  recurrence: Recurrence,
  until: Date = MAX_DATE,
): string[] {
  if (recurrence === "none") return [startYmd];
  const start = parseYmd(startYmd);
  if (start > until) return [];

  const dates: string[] = [];
  let current = new Date(start);
  let i = 0;

  while (current <= until && dates.length < MAX_OCCURRENCES) {
    dates.push(ymd(current));
    i += 1;
    switch (recurrence) {
      case "daily":
        current = new Date(current);
        current.setDate(current.getDate() + 1);
        break;
      case "every_other_day":
        current = new Date(current);
        current.setDate(current.getDate() + 2);
        break;
      case "weekly":
        current = new Date(current);
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current = addMonthsPreservingDay(start, i);
        break;
      case "quarterly":
        current = addMonthsPreservingDay(start, i * 3);
        break;
      case "yearly":
        current = addMonthsPreservingDay(start, i * 12);
        break;
    }
  }
  return dates;
}

export function expandOccurrences(
  template: Omit<CalendarEvent, "id">,
  recurrence: Recurrence,
): CalendarEvent[] {
  const dates = generateOccurrenceDates(template.date, recurrence);
  return dates.map((date) => ({
    ...template,
    id: crypto.randomUUID(),
    date,
  }));
}
