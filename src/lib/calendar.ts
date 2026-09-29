const ZONE = "America/Bogota";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "Mes";
}

export function monthNames(): string[] {
  return MONTHS;
}

/** Calendar parts in Bogotá. */
export function bogotaToday(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

/** Midnight in Bogotá, as an ISO instant. `dayOffset` moves whole calendar days. */
export function bogotaStartIso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0)).toISOString();
}

export function dayRange(daysAgo: number): { since: string; until: string } {
  const today = bogotaToday();
  const start = shift(today, -daysAgo);
  const end = shift(today, -daysAgo + 1);
  return {
    since: bogotaStartIso(start.year, start.month, start.day),
    until: bogotaStartIso(end.year, end.month, end.day),
  };
}

export function monthRange(year: number, month: number): { since: string; until: string } {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    since: bogotaStartIso(year, month, 1),
    until: bogotaStartIso(nextYear, nextMonth, 1),
  };
}

export function yearRange(year: number): { since: string; until: string } {
  return {
    since: bogotaStartIso(year, 1, 1),
    until: bogotaStartIso(year + 1, 1, 1),
  };
}

export function windowRange(days: number): { since: string; until: string } {
  const today = bogotaToday();
  const start = shift(today, -(days - 1));
  const end = shift(today, 1);
  return {
    since: bogotaStartIso(start.year, start.month, start.day),
    until: bogotaStartIso(end.year, end.month, end.day),
  };
}

export function copLabel(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function groupedInt(value: number): string {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
}

function shift(
  date: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}
