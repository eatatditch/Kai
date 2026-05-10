// ISO 8601 week calculations. Weeks start Monday; week 1 is the week
// containing the year's first Thursday.

export type IsoWeek = { year: number; week: number };

export function isoWeekOf(date: Date): IsoWeek {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: d.getUTCFullYear(), week };
}

export function currentIsoWeek(): IsoWeek {
  return isoWeekOf(new Date());
}

// Monday of an ISO week (local time, midnight).
export function mondayOfIsoWeek({ year, week }: IsoWeek): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (jan4Day - 1));
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function previousIsoWeek(w: IsoWeek): IsoWeek {
  const monday = mondayOfIsoWeek(w);
  monday.setDate(monday.getDate() - 7);
  return isoWeekOf(monday);
}

export function formatIsoWeek({ year, week }: IsoWeek): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function formatWeekRange(w: IsoWeek): string {
  const monday = mondayOfIsoWeek(w);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const yearSuffix =
    monday.getFullYear() === sunday.getFullYear()
      ? `, ${monday.getFullYear()}`
      : "";
  return `${fmt(monday)} — ${fmt(sunday)}${yearSuffix}`;
}
