"use client";

import { useAuth } from "@/components/auth-provider";
import { CountingValue } from "@/components/counting-value";
import { PlanInactive } from "@/components/plan-inactive";
import { Banner, Button } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { useWorkspace } from "@/components/workspace-provider";
import { bogotaToday, bogotaYear, copLabel, groupedInt, monthName, monthNames, yearChoices } from "@/lib/calendar";
import { getPaymentHistory, getStats } from "@/lib/payments";
import { isPlanActive } from "@/lib/types";
import type { StatsPoint, StatsReport } from "@/lib/types";
import { TrendDown, TrendUp } from "@phosphor-icons/react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CIAN = "#88e7f3";
const AXIS = "rgba(211, 246, 251, 0.45)";
const GRID = "rgba(211, 246, 251, 0.08)";
const SLIDE = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };

export default function EstadisticasPage() {
  const { accessToken } = useAuth();
  const { workspace } = useWorkspace();
  const planOn = isPlanActive(workspace);
  const today = bogotaToday();
  const [grain, setGrain] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [report, setReport] = useState<StatsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [earliestYear, setEarliestYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const segRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const root = segRef.current;
    if (!root) return;
    const measure = () => {
      const active = root.querySelector<HTMLElement>("[data-grain-on='true']");
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
  }, [grain, planOn]);

  useEffect(() => {
    setGrain("month");
    setMonth(today.month);
    setYear(today.year);
    // The desk always opens on the current month, the same way the phone does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planOn]);

  useEffect(() => {
    if (!accessToken || !planOn) return;
    let alive = true;
    getPaymentHistory(accessToken)
      .then((row) => {
        if (alive) setEarliestYear(bogotaYear(row.earliestAt));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [accessToken, planOn]);

  useEffect(() => {
    if (!accessToken || !planOn) return;
    let alive = true;
    setLoading(true);
    setError(null);
    getStats(accessToken, year, grain === "month" ? month : undefined)
      .then((next) => {
        if (alive) setReport(next);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar las estadísticas.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [accessToken, planOn, grain, year, month, reload]);

  if (!planOn) {
    return (
      <section>
        <h1 className="stats-title">Estadísticas</h1>
        <PlanInactive />
      </section>
    );
  }

  const byDay = grain === "month";
  const unit = byDay ? "día" : "mes";
  const bucketWord = byDay ? "Día" : "Mes";
  const emptyWord = byDay ? "Días" : "Meses";
  const period = byDay ? `${monthName(month)} ${year}` : String(year);

  function openMonth(point: StatsPoint | undefined) {
    if (!point) return;
    const match = /^(\d{4})-(\d{2})$/.exec(point.key);
    if (!match) return;
    const nextYear = Number(match[1]);
    const nextMonth = Number(match[2]);
    if (nextMonth < 1 || nextMonth > 12) return;
    setYear(nextYear);
    setMonth(nextMonth);
    setGrain("month");
  }

  return (
    <section className="stats">
      <header className="stats-top">
        <h1 className="stats-title">Estadísticas</h1>
        <div className="stats-filters">
          <MotionConfig reducedMotion="user">
            <div className="seg" role="tablist" aria-label="Periodo" ref={segRef}>
              {pill ? (
                <motion.span
                  className="seg-pill"
                  initial={false}
                  animate={{ x: pill.x, y: pill.y, width: pill.w }}
                  transition={SLIDE}
                />
              ) : null}
              <button
                type="button"
                data-grain-on={grain === "month" ? "true" : "false"}
                aria-pressed={grain === "month"}
                className={grain === "month" ? "is-on" : undefined}
                onClick={() => setGrain("month")}
              >
                <span>Mes</span>
              </button>
              <button
                type="button"
                data-grain-on={grain === "year" ? "true" : "false"}
                aria-pressed={grain === "year"}
                className={grain === "year" ? "is-on" : undefined}
                onClick={() => setGrain("year")}
              >
                <span>Año</span>
              </button>
            </div>
          </MotionConfig>
          <Dropdown
            ariaLabel="Mes"
            valueLabel={monthName(month)}
            value={String(month)}
            fit
            onChange={(id) => {
              setMonth(Number(id));
              setGrain("month");
            }}
            options={monthNames().map((name, index) => ({
              id: String(index + 1),
              label: name,
            }))}
          />
          <Dropdown
            ariaLabel="Año"
            valueLabel={String(year)}
            value={String(year)}
            align="right"
            onChange={(id) => {
              setYear(Number(id));
              setGrain("year");
            }}
            options={yearChoices(today.year, earliestYear).map((value) => ({
              id: String(value),
              label: String(value),
            }))}
          />
        </div>
      </header>

      {error ? (
        <Banner>
          {error}
          <div className="banner-actions">
            <Button type="button" variant="ghost" onClick={() => setReload((current) => current + 1)}>
              Reintentar
            </Button>
          </div>
        </Banner>
      ) : null}

      {loading && !report ? <p className="lede">Cargando estadísticas…</p> : null}

      {report ? (
        <>
          <div className="stats-kpis">
            <article className="stats-kpi">
              <span>Total pagos</span>
              <strong>
                <CountingValue value={report.count} format={(next) => groupedInt(Math.round(next))} />
              </strong>
            </article>
            <article className="stats-kpi">
              <span>Total valor</span>
              <strong className="is-value">
                <CountingValue value={report.amount} format={(next) => copLabel(Math.round(next))} />
              </strong>
            </article>
            <article className="stats-kpi">
              <span>Promedio por pago</span>
              <strong>
                <CountingValue value={report.averagePerPayment} format={(next) => copLabel(Math.round(next))} />
              </strong>
            </article>
            <article className="stats-kpi">
              <span>Clientes únicos</span>
              <strong>
                <CountingValue value={report.uniquePayers} format={(next) => groupedInt(Math.round(next))} />
              </strong>
            </article>
          </div>

          <div className="stats-body">
            <div className="stats-charts">
              <article className="stats-card">
                <h2>Pagos por {unit}</h2>
                <p>{period}</p>
                <Plot ready={mounted} empty={report.points.length === 0} drill={grain === "year"}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={report.points}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      onClick={
                        grain === "year"
                          ? (state) => openMonth(pointAt(report.points, state.activeIndex))
                          : undefined
                      }
                    >
                      <defs>
                        <linearGradient id="stats-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CIAN} stopOpacity={0.38} />
                          <stop offset="100%" stopColor={CIAN} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="label" interval={tickEvery(report.points.length)} tick={tick} axisLine={false} tickLine={false} />
                      <YAxis width={36} allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
                      <Tooltip content={(props) => <StatsTip {...props} mode="count" />} cursor={{ stroke: CIAN, strokeOpacity: 0.35 }} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={CIAN}
                        strokeWidth={2}
                        fill="url(#stats-area)"
                        dot={{ r: 3, fill: CIAN, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: CIAN, stroke: "#021113", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Plot>
              </article>

              <article className="stats-card">
                <h2>Valor por {unit}</h2>
                <p>{period}</p>
                <Plot ready={mounted} empty={report.points.length === 0} drill={grain === "year"}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={report.points}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      onClick={
                        grain === "year"
                          ? (state) => openMonth(pointAt(report.points, state.activeIndex))
                          : undefined
                      }
                    >
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="label" interval={tickEvery(report.points.length)} tick={tick} axisLine={false} tickLine={false} />
                      <YAxis width={48} tick={tick} axisLine={false} tickLine={false} tickFormatter={axisCop} />
                      <Tooltip content={(props) => <StatsTip {...props} mode="amount" />} cursor={{ fill: "rgba(136, 231, 243, 0.08)" }} />
                      <Bar dataKey="amount" fill={CIAN} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </Plot>
              </article>
            </div>

            <aside className="stats-side">
              <h2>Desglose y comparativas</h2>
              <div className="stats-side-swap">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={sideKey(report)}
                    className="stats-side-panel"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
                    transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <CompareLine label="vs periodo anterior (pagos)" percent={report.countChangePercent} />
                    <CompareLine label="vs periodo anterior (valor)" percent={report.amountChangePercent} />
                    <SideLine label={`${bucketWord} mayor`} value={extreme(report.peak)} tone="value" />
                    <SideLine label={`${bucketWord} menor`} value={extreme(report.low)} tone="amber" />
                    <SideLine label={`Prom. pagos / ${unit}`} value={decimalLabel(report.averageCount)} />
                    <SideLine label={`Prom. valor / ${unit}`} value={copLabel(report.averageAmount)} />
                    <SideLine
                      label={`${emptyWord} con ventas / vacíos`}
                      value={`${groupedInt(report.bucketsWithSales)} / ${groupedInt(report.bucketsEmpty)}`}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}

const tick = { fill: AXIS, fontSize: 11 };

function tickEvery(count: number): number {
  if (count <= 12) return 0;
  return 4;
}

function Plot({
  ready,
  empty,
  drill,
  children,
}: {
  ready: boolean;
  empty: boolean;
  drill?: boolean;
  children: React.ReactNode;
}) {
  if (empty) return <p className="lede">Sin pagos en este periodo.</p>;
  if (!ready) return <div className="stats-plot" />;
  return <div className={drill ? "stats-plot is-drill" : "stats-plot"}>{children}</div>;
}

function pointAt(points: StatsPoint[], index: unknown): StatsPoint | undefined {
  if (typeof index !== "number" && typeof index !== "string") return undefined;
  const n = Number(index);
  if (!Number.isInteger(n) || n < 0 || n >= points.length) return undefined;
  return points[n];
}

function StatsTip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: StatsPoint }>;
  mode: "count" | "amount";
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="stats-tipbox">
      <p>{point.detail}</p>
      <strong>{mode === "count" ? `${groupedInt(point.count)} pagos` : copLabel(point.amount)}</strong>
    </div>
  );
}

function sideKey(report: StatsReport): string {
  return [
    report.grain,
    report.year,
    report.month ?? "y",
    report.countChangePercent ?? "x",
    report.amountChangePercent ?? "x",
    report.peak?.key ?? "",
    report.peak?.amount ?? "",
    report.low?.key ?? "",
    report.low?.amount ?? "",
    report.averageCount,
    report.averageAmount,
    report.bucketsWithSales,
    report.bucketsEmpty,
  ].join("|");
}

function SideLine({ label, value, tone }: { label: string; value: string; tone?: "value" | "amber" }) {
  return (
    <div className="stats-line">
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function CompareLine({ label, percent }: { label: string; percent: number | null }) {
  const down = percent != null && percent < 0;
  const badge = percent != null && percent !== 0;
  const tint = down ? "rose" : "emerald";
  const text = percent == null ? "Sin periodo anterior" : percent === 0 ? "0%" : signedPercent(percent);
  return (
    <div className="stats-line">
      <span>{label}</span>
      <strong className={badge ? `stats-badge is-${tint}` : undefined}>
        {badge ? down ? <TrendDown size={14} /> : <TrendUp size={14} /> : null}
        {text}
      </strong>
    </div>
  );
}

function extreme(point: StatsPoint | null): string {
  if (!point) return "—";
  return `${point.detail} · ${copLabel(point.amount)}`;
}

function signedPercent(value: number): string {
  const tenths = Math.round(value * 10) / 10;
  const sign = tenths > 0 ? "+" : "";
  const text = Number.isInteger(tenths) ? String(tenths) : tenths.toString().replace(".", ",");
  return `${sign}${text}%`;
}

function decimalLabel(value: number): string {
  const tenths = Math.round(value * 10) / 10;
  if (Number.isInteger(tenths)) return groupedInt(tenths);
  const whole = Math.trunc(tenths);
  const frac = Math.abs(Math.round(tenths * 10) % 10);
  return `${groupedInt(whole)},${frac}`;
}

function axisCop(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    const text = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(".", ",");
    return `${text} M`;
  }
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)} mil`;
  return groupedInt(value);
}
