"use client";

import { useAuth } from "@/components/auth-provider";
import { CountingValue } from "@/components/counting-value";
import { Dropdown } from "@/components/dropdown";
import { PlanInactive } from "@/components/plan-inactive";
import { Banner, Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import {
  bogotaToday,
  bogotaYear,
  copLabel,
  dayRange,
  groupedInt,
  monthName,
  monthNames,
  monthRange,
  weekRange,
  windowRange,
  yearChoices,
  yearRange,
} from "@/lib/calendar";
import { getPaymentHistory, listPayments } from "@/lib/payments";
import { isPlanActive } from "@/lib/types";
import type { PaymentNotice } from "@/lib/types";
import { CaretLeft, CaretRight, MagnifyingGlass, Receipt } from "@phosphor-icons/react";
import { motion, MotionConfig } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type RangeId = "hoy" | "ayer" | "semana" | "mes" | "anio" | "todos" | "ventana";
type Window = { since?: string; until?: string };

const PAGE_SIZES = [10, 25, 50, 100] as const;
const SLIDE = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };

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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [rows, setRows] = useState<PaymentNotice[]>([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [statsKey, setStatsKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [earliestYear, setEarliestYear] = useState<number | null>(null);
  const segRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number } | null>(null);

  const span = useMemo(
    () => payWindow(range, month, year, lookback),
    [range, month, year, lookback],
  );
  const filterKey = `${employee}|${range}|${month}|${year}|${appliedQuery}|${span.since ?? ""}|${span.until ?? ""}`;
  const [seenKey, setSeenKey] = useState(filterKey);
  if (seenKey !== filterKey) {
    setSeenKey(filterKey);
    setPage(0);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => setAppliedQuery(query), 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!accessToken || employee) return;
    let alive = true;
    getPaymentHistory(accessToken)
      .then((row) => {
        if (alive) setEarliestYear(bogotaYear(row.earliestAt));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [accessToken, employee]);

  useLayoutEffect(() => {
    const root = segRef.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>("[data-range-on='true']");
      if (!active) return;
      const next = { x: active.offsetLeft, y: active.offsetTop, w: active.offsetWidth };
      setPill((current) =>
        current && current.x === next.x && current.y === next.y && current.w === next.w ? current : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [range, month, year, employee, lookback]);

  useEffect(() => {
    if (!accessToken) return;
    let cancel = false;
    const key = filterKey;
    const target = page;
    setPaging(true);
    setError(null);

    listPayments(
      accessToken,
      {
        limit: pageSize,
        offset: target * pageSize,
        q: appliedQuery.trim() || undefined,
        since: span.since,
        until: span.until,
      },
      employee,
    )
      .then((feed) => {
        if (cancel) return;
        const nextCount = feed.count ?? feed.notices.length;
        const pages = Math.max(1, Math.ceil(nextCount / pageSize));
        if (target > pages - 1) {
          setPage(pages - 1);
          return;
        }
        setRows(feed.notices);
        setCount(nextCount);
        setTotal(feed.totalAmount ?? 0);
        setStatsKey(key);
      })
      .catch((err: unknown) => {
        if (!cancel) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los avisos.");
        }
      })
      .finally(() => {
        if (!cancel) {
          setLoading(false);
          setPaging(false);
        }
      });

    return () => {
      cancel = true;
    };
  }, [accessToken, appliedQuery, attempt, employee, filterKey, page, pageSize, span.since, span.until]);

  const years = yearChoices(today.year, earliestYear);
  const quickTabs = employee ? employeeTabs(lookback) : (["hoy", "ayer"] as RangeId[]);
  const ready = statsKey === filterKey;
  const hasTotals = statsKey !== "";
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const showPager = ready && count > 0;

  return (
    <section className="pay-dash">
      <header className="pay-head">
        <h1>{payHeading(range, month, year, lookback)}</h1>
        <p className="pay-total">
          <strong>
            {hasTotals ? <CountingValue value={total} format={(next) => copLabel(Math.round(next))} /> : "—"}
          </strong>
          <span>
            {hasTotals ? <CountingValue value={count} format={(next) => countLabel(Math.round(next))} /> : "Cargando…"}
          </span>
        </p>
      </header>

      <div className="pay-toolbar">
        <MotionConfig reducedMotion="user">
          <div className="seg" role="group" aria-label="Periodo" ref={segRef}>
            {pill ? (
              <motion.span
                className="seg-pill"
                initial={false}
                animate={{ x: pill.x, y: pill.y, width: pill.w }}
                transition={SLIDE}
              />
            ) : null}
            {quickTabs.map((id) => (
              <button
                key={id}
                type="button"
                data-range-on={range === id ? "true" : "false"}
                aria-pressed={range === id}
                className={range === id ? "is-on" : undefined}
                onClick={() => setRange(id)}
              >
                <span>{quickLabel(id, lookback)}</span>
              </button>
            ))}

            {!employee ? (
              <>
                <div
                  className={range === "mes" ? "seg-slot is-on" : "seg-slot"}
                  data-range-on={range === "mes" ? "true" : "false"}
                >
                  <Dropdown
                    ariaLabel="Mes"
                    valueLabel={monthName(month)}
                    value={String(month)}
                    align="right"
                    fit
                    onChange={(id) => {
                      setMonth(Number(id));
                      setRange("mes");
                    }}
                    options={monthNames().map((name, index) => ({
                      id: String(index + 1),
                      label: name,
                    }))}
                  />
                </div>
                <div
                  className={range === "anio" ? "seg-slot is-on" : "seg-slot"}
                  data-range-on={range === "anio" ? "true" : "false"}
                >
                  <Dropdown
                    ariaLabel="Año"
                    valueLabel={String(year)}
                    value={String(year)}
                    align="right"
                    onChange={(id) => {
                      setYear(Number(id));
                      setRange("anio");
                    }}
                    options={years.map((value) => ({ id: String(value), label: String(value) }))}
                  />
                </div>
                <button
                  type="button"
                  data-range-on={range === "todos" ? "true" : "false"}
                  aria-pressed={range === "todos"}
                  className={range === "todos" ? "is-on" : undefined}
                  onClick={() => setRange("todos")}
                >
                  <span>Todos</span>
                </button>
              </>
            ) : null}
          </div>
        </MotionConfig>
        <label className="search-box">
          <MagnifyingGlass size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, referencia..."
            aria-label="Buscar por nombre o referencia"
          />
        </label>
      </div>

      {error ? (
        <Banner>
          {error}
          <div className="banner-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAttempt((current) => current + 1)}
            >
              Reintentar
            </Button>
          </div>
        </Banner>
      ) : null}

      {!planOn && !appliedQuery.trim() && !loading && count === 0 ? (
        <PlanInactive />
      ) : (
        <div className="pay-board">
          {!planOn ? (
            <div className="pay-board-note">
              <PlanInactive />
            </div>
          ) : null}
          {loading || paging ? (
            <div className="pay-skel" aria-busy="true" aria-label="Cargando pagos">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : rows.length === 0 ? (
            <div className="pay-empty">
              <span className="pay-empty-icon" aria-hidden="true">
                <Receipt size={28} weight="regular" />
              </span>
              <h2>
                {appliedQuery.trim()
                  ? "Sin movimientos registrados"
                  : emptyTitle(range, employee)}
              </h2>
              <p>
                {appliedQuery.trim()
                  ? "Ningún aviso coincide con esa búsqueda."
                  : "Los pagos confirmados aparecerán aquí automáticamente."}
              </p>
            </div>
          ) : (
            <table className="pay-grid">
              <caption className="sr-only">
                {countLabel(count)} · {copLabel(total)}
              </caption>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((notice) => {
                  const name =
                    notice.payerName ?? (notice.readable ? "Transferencia Bancolombia" : "Sin leer");
                  return (
                    <tr key={notice.id}>
                      <td>
                        <strong className="pay-who">{name}</strong>
                      </td>
                      <td className="pay-when">{formatWhen(notice.occurredAt ?? notice.receivedAt)}</td>
                      <td>
                        {notice.confirmedByEmail ? (
                          <span className="status-badge">Verificado</span>
                        ) : (
                          <span className="status-badge is-wait">Pendiente</span>
                        )}
                      </td>
                      <td className="pay-sum">{notice.amountLabel ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {showPager ? (
            <nav className="pay-pager" aria-label="Páginas de pagos">
              <button type="button" disabled={page === 0 || paging} onClick={() => setPage((current) => current - 1)}>
                <CaretLeft size={14} weight="bold" aria-hidden="true" />
                Anterior
              </button>
              <div className="pay-pager-pages">
                {pageWindow(page, pageCount).map((item, index) =>
                  item === "gap" ? (
                    <span key={`gap-${index}`} className="pay-pager-gap" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      aria-current={item === page ? "page" : undefined}
                      disabled={paging}
                      onClick={() => setPage(item)}
                    >
                      {item + 1}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                disabled={page >= pageCount - 1 || paging}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
                <CaretRight size={14} weight="bold" aria-hidden="true" />
              </button>
              <label className="pay-pager-size">
                <span>Por página</span>
                <select
                  aria-label="Pagos por página"
                  value={pageSize}
                  onChange={(event) => {
                    const next = Number(event.target.value) as (typeof PAGE_SIZES)[number];
                    setPageSize(next);
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </nav>
          ) : null}
        </div>
      )}
    </section>
  );
}

function quickLabel(id: RangeId, lookback: number): string {
  if (id === "ayer") return "Ayer";
  if (id === "semana") return "Esta semana";
  if (id === "ventana") return `${lookback} días`;
  return "Hoy";
}

function payHeading(range: RangeId, month: number, year: number, lookback: number): string {
  if (range === "hoy") return "Pagos de hoy";
  if (range === "ayer") return "Pagos de ayer";
  if (range === "semana") return "Pagos de esta semana";
  if (range === "ventana") return `Últimos ${lookback} días`;
  if (range === "mes") return `Pagos de ${monthName(month).toLowerCase()}`;
  if (range === "anio") return `Pagos de ${year}`;
  return "Pagos";
}

function employeeTabs(lookback: number): RangeId[] {
  const tabs: RangeId[] = ["hoy"];
  if (lookback >= 3) tabs.push("ayer");
  if (lookback >= 7) tabs.push("semana");
  else if (lookback >= 3) tabs.push("ventana");
  return tabs;
}

function employeeLookback(days: number | undefined): number {
  if (days === 7 || days === 3) return days;
  return 1;
}

function payWindow(range: RangeId, month: number, year: number, lookback: number): Window {
  if (range === "hoy") return dayRange(0);
  if (range === "ayer") return dayRange(1);
  if (range === "semana") return weekRange();
  if (range === "ventana") return windowRange(lookback);
  if (range === "mes") return monthRange(year, month);
  if (range === "anio") return yearRange(year);
  return {};
}

function emptyTitle(range: RangeId, employee: boolean): string {
  const todayish = employee ? range === "hoy" || range === "ventana" : range === "hoy" || range === "todos";
  return todayish ? "Aún no hay pagos hoy" : "Sin movimientos registrados";
}

function countLabel(count: number): string {
  return count === 1 ? "1 pago registrado" : `${groupedInt(count)} pagos registrados`;
}

function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const wanted = [0, total - 1, current - 1, current, current + 1].filter(
    (value, index, all) => value >= 0 && value < total && all.indexOf(value) === index,
  );
  wanted.sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  wanted.forEach((value, index) => {
    if (index > 0 && value - wanted[index - 1] > 1) out.push("gap");
    out.push(value);
  });
  return out;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const today = bogotaToday();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  if (pick("year") === today.year && pick("month") === today.month && pick("day") === today.day) {
    return time;
  }
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${day} · ${time}`;
}
