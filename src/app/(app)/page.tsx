"use client";

import { useAuth } from "@/components/auth-provider";
import { PlanInactive } from "@/components/plan-inactive";
import { Banner, Button, Dialog } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import {
  bogotaToday,
  copLabel,
  dayRange,
  groupedInt,
  monthName,
  monthNames,
  monthRange,
  windowRange,
  yearRange,
} from "@/lib/calendar";
import { listPayments } from "@/lib/payments";
import { isPlanActive } from "@/lib/types";
import type { PaymentNotice } from "@/lib/types";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type RangeId = "hoy" | "ayer" | "mes" | "anio" | "todos" | "ventana";

type Window = { since?: string; until?: string };

const FIRST_YEAR = 2026;

export default function PagosPage() {
  const { accessToken, kind, employeeSession } = useAuth();
  const { workspace } = useWorkspace();
  const employee = kind === "employee";
  const planOn = employee || isPlanActive(workspace);
  const lookback = employeeLookback(employeeSession?.employee.lookbackDays);
  const today = bogotaToday();
  const [range, setRange] = useState<RangeId>("hoy");
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sheet, setSheet] = useState<"mes" | "anio" | null>(null);
  const [notices, setNotices] = useState<PaymentNotice[]>([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const span = useMemo(
    () => payWindow(range, month, year, lookback),
    [range, month, year, lookback],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const feed = await listPayments(
        accessToken,
        {
          limit: 100,
          q: appliedQuery.trim() || undefined,
          since: span.since,
          until: span.until,
        },
        employee,
      );
      setNotices(feed.notices);
      setCount(feed.count ?? feed.notices.length);
      setTotal(feed.totalAmount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los avisos.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, appliedQuery, employee, span.since, span.until]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => setAppliedQuery(query), 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  const heading = payHeading(range, month, year, lookback);
  const groups = groupByDay(notices);
  const years = yearChoices(today.year);

  function choose(id: RangeId) {
    if (id === "mes") {
      setSheet("mes");
      return;
    }
    if (id === "anio") {
      setSheet("anio");
      return;
    }
    setRange(id);
  }

  return (
    <section>
      <header className="pay-head">
        <h1>{heading.title}</h1>
        <p className="pay-total">{copLabel(total)}</p>
        {heading.period ? <p className="pay-period">{heading.period}</p> : <span />}
        <p className="pay-count">{countLabel(count)}</p>
      </header>

      <label className="search-box">
        <MagnifyingGlass size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar por nombre"
        />
      </label>

      <div className="chip-row chip-scroll" role="tablist" aria-label="Periodo">
        {(employee ? employeeChips(lookback) : ownerChips(month, year)).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={range === chip.id}
            className={range === chip.id ? "chip is-on" : "chip"}
            onClick={() => choose(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error ? (
        <Banner>
          {error}
          <div className="banner-actions">
            <Button type="button" variant="ghost" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        </Banner>
      ) : null}

      {loading ? (
        <div className="empty-box" aria-busy="true">
          Cargando avisos…
        </div>
      ) : notices.length === 0 ? (
        !planOn && !appliedQuery.trim() ? (
          <PlanInactive />
        ) : (
          <div className="empty-box">
            {appliedQuery.trim() ? "Ningún aviso con ese nombre." : "Todavía no hay avisos en este periodo."}
          </div>
        )
      ) : (
        <>
          {!planOn ? <PlanInactive /> : null}
          <div className="pay-days">
            {groups.map((group) => (
              <section key={group.day}>
                <h2>{group.day}</h2>
                <ul>
                  {group.notices.map((notice) => (
                    <li key={notice.id}>
                      <div>
                        <strong>{notice.payerName ?? (notice.readable ? "Transferencia Bancolombia" : "Sin leer")}</strong>
                        <span>{formatWhen(notice.occurredAt ?? notice.receivedAt)}</span>
                      </div>
                      <div className="pay-day-amount">
                        <span>{notice.amountLabel ?? "—"}</span>
                        {notice.confirmedByEmail ? <em>Verificado</em> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <Dialog open={sheet === "mes"} onClose={() => setSheet(null)} title="Mes">
        <ul className="choice-list">
          {monthNames().map((name, index) => {
            const value = index + 1;
            const on = range === "mes" && month === value;
            return (
              <li key={name}>
                <button
                  type="button"
                  className={on ? "is-on" : undefined}
                  onClick={() => {
                    setMonth(value);
                    setRange("mes");
                    setSheet(null);
                  }}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
      <Dialog open={sheet === "anio"} onClose={() => setSheet(null)} title="Año">
        <ul className="choice-list">
          {years.map((value) => {
            const on = range === "anio" && year === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  className={on ? "is-on" : undefined}
                  onClick={() => {
                    setYear(value);
                    setRange("anio");
                    setSheet(null);
                  }}
                >
                  {value}
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </section>
  );
}

function ownerChips(month: number, year: number): { id: RangeId; label: string }[] {
  return [
    { id: "hoy", label: "Hoy" },
    { id: "ayer", label: "Ayer" },
    { id: "mes", label: monthName(month) },
    { id: "anio", label: String(year) },
    { id: "todos", label: "Todos" },
  ];
}

function employeeChips(lookback: number): { id: RangeId; label: string }[] {
  const chips: { id: RangeId; label: string }[] = [{ id: "hoy", label: "Hoy" }];
  if (lookback >= 3) {
    chips.push({ id: "ayer", label: "Ayer" });
    chips.push({ id: "ventana", label: `${lookback} días` });
  }
  return chips;
}

function employeeLookback(days: number | undefined): number {
  if (days === 7 || days === 3) return days;
  return 1;
}

function payWindow(range: RangeId, month: number, year: number, lookback: number): Window {
  if (range === "hoy") return dayRange(0);
  if (range === "ayer") return dayRange(1);
  if (range === "ventana") return windowRange(lookback);
  if (range === "mes") return monthRange(year, month);
  if (range === "anio") return yearRange(year);
  return {};
}

function payHeading(range: RangeId, month: number, year: number, lookback: number): { title: string; period: string | null } {
  if (range === "mes") return { title: "Pagos de", period: `${monthName(month)} ${year}` };
  if (range === "anio") return { title: "Pagos de", period: String(year) };
  if (range === "ayer") return { title: "Pagos de ayer", period: null };
  if (range === "ventana") return { title: `Últimos ${lookback} días`, period: null };
  if (range === "todos") return { title: "Pagos", period: null };
  return { title: "Pagos de hoy", period: null };
}

function countLabel(count: number): string {
  return count === 1 ? "1 pago" : `${groupedInt(count)} pagos`;
}

function yearChoices(current: number): number[] {
  const start = Math.min(FIRST_YEAR, current);
  const years: number[] = [];
  for (let value = current; value >= start; value -= 1) years.push(value);
  return years;
}

function groupByDay(notices: PaymentNotice[]): { day: string; notices: PaymentNotice[] }[] {
  const groups: { day: string; notices: PaymentNotice[] }[] = [];
  for (const notice of notices) {
    const day = dayTitle(notice.occurredAt ?? notice.receivedAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.notices.push(notice);
    else groups.push({ day, notices: [notice] });
  }
  return groups;
}

function dayTitle(iso: string | null): string {
  if (!iso) return "Reciente";
  const date = new Date(iso);
  const today = bogotaToday();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const y = pick("year");
  const m = pick("month");
  const d = pick("day");
  if (y === today.year && m === today.month && d === today.day) return "Hoy";
  const yesterday = dayRange(1);
  const yParts = new Date(yesterday.since);
  const yp = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(yParts);
  const yPick = (type: string) => Number(yp.find((part) => part.type === type)?.value);
  if (y === yPick("year") && m === yPick("month") && d === yPick("day")) return "Ayer";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
