"use client";

import { useAuth } from "@/components/auth-provider";
import { PlanInactive } from "@/components/plan-inactive";
import { Banner, Button, Dialog } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { bogotaToday, copLabel, groupedInt, monthName, monthNames } from "@/lib/calendar";
import { getStats } from "@/lib/payments";
import { isPlanActive } from "@/lib/types";
import type { StatsPoint, StatsReport } from "@/lib/types";
import {
  Calculator,
  CalendarBlank,
  HandTap,
  TrendDown,
  TrendUp,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";

const VISITS_KEY = "noduq.stats.tip.visits";
const DISMISS_KEY = "noduq.stats.tip.dismissed";
const FIRST_YEAR = 2026;

export default function EstadisticasPage() {
  const { accessToken } = useAuth();
  const { workspace } = useWorkspace();
  const planOn = isPlanActive(workspace);
  const today = bogotaToday();
  const [grain, setGrain] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.month);
  const [year, setYear] = useState(today.year);
  const [sheet, setSheet] = useState<"mes" | "anio" | null>(null);
  const [report, setReport] = useState<StatsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState(false);
  const [picked, setPicked] = useState(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setGrain("month");
    setMonth(today.month);
    setYear(today.year);
    if (!planOn) return;
    setTip(countTipVisit());
    // The desk always opens on the current month, the same way the phone does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planOn]);

  useEffect(() => {
    if (!accessToken || !planOn) return;
    let alive = true;
    setLoading(true);
    setError(null);
    getStats(accessToken, year, grain === "month" ? month : undefined)
      .then((next) => {
        if (!alive) return;
        setReport(next);
        const peak = next.points.findIndex((point) => point.key === next.peak?.key);
        setPicked(peak >= 0 ? peak : Math.max(0, next.points.length - 1));
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
  const touched = report?.points[picked];
  const countCaption = touched
    ? `${touched.detail} · ${groupedInt(touched.count)} pagos`
    : `Elige un punto para ver un ${unit}.`;
  const valueCaption = touched
    ? `${touched.detail} · ${copLabel(touched.amount)}`
    : "Elige una barra para ver el total.";

  return (
    <section className="stats">
      <h1 className="stats-title">Estadísticas</h1>
      <div className="chip-row chip-scroll" role="tablist" aria-label="Periodo">
        <button type="button" className={grain === "month" ? "chip is-on" : "chip"} onClick={() => setGrain("month")}>
          Mes
        </button>
        <button type="button" className={grain === "year" ? "chip is-on" : "chip"} onClick={() => setGrain("year")}>
          Año
        </button>
        <button
          type="button"
          className={grain === "month" ? "chip is-own" : "chip"}
          onClick={() => setSheet("mes")}
        >
          {monthName(month)} ▾
        </button>
        <button
          type="button"
          className={grain === "year" ? "chip is-own" : "chip"}
          onClick={() => setSheet("anio")}
        >
          {year} ▾
        </button>
      </div>

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
          {tip ? (
            <div className="stats-tip">
              <HandTap size={18} weight="fill" aria-hidden="true" />
              <p>Toca cualquier punto o barra en las gráficas para ver el detalle exacto de ese día o mes.</p>
              <button type="button" aria-label="Cerrar" onClick={() => { dismissTip(); setTip(false); }}>
                <X size={14} />
              </button>
            </div>
          ) : null}

          <article className="stats-card">
            <h2>{byDay ? `${monthName(month)} ${year} — Pagos por día` : `${year} — Pagos por mes`}</h2>
            <p>{countCaption}</p>
            <Trend points={report.points} selected={picked} onSelect={setPicked} bars={false} valueOf={(point) => point.count} />
          </article>
          <article className="stats-card">
            <h2>{byDay ? `${monthName(month)} ${year} — Valor por día` : `${year} — Valor por mes`}</h2>
            <p>{valueCaption}</p>
            <Trend points={report.points} selected={picked} onSelect={setPicked} bars valueOf={(point) => point.amount} />
          </article>

          <div className="stats-headlines">
            <div>
              <span>Total pagos</span>
              <strong className="is-soft">{groupedInt(report.count)}</strong>
            </div>
            <div>
              <span>Total valor</span>
              <strong className="is-value">{copLabel(report.amount)}</strong>
            </div>
          </div>
          <ul className="stats-rows">
            <Metric icon={<Calculator size={16} />} tint="cyan" label={`Prom. pagos / ${unit} (${report.bucketCount})`} value={decimalLabel(report.averageCount)} />
            <Metric icon={<Calculator size={16} />} tint="cyan" label={`Prom. valor / ${unit} (${report.bucketCount})`} value={copLabel(report.averageAmount)} />
            <Metric icon={<Calculator size={16} />} tint="cyan" label="Prom. / pago" value={copLabel(report.averagePerPayment)} />
            <Metric icon={<UsersThree size={16} />} tint="violet" label="Clientes únicos" value={groupedInt(report.uniquePayers)} />
            <Compare label="vs periodo anterior (pagos)" percent={report.countChangePercent} />
            <Compare label="vs periodo anterior (valor)" percent={report.amountChangePercent} />
            <Metric icon={<TrendDown size={16} />} tint="amber" label={`${bucketWord} menor`} value={extreme(report.low)} valueTint="amber" />
            <Metric icon={<TrendUp size={16} />} tint="value" label={`${bucketWord} mayor`} value={extreme(report.peak)} valueTint="value" />
            <Metric icon={<CalendarBlank size={16} />} tint="cyan" label={`${emptyWord} con ventas / vacíos`} value={`${report.bucketsWithSales} / ${report.bucketsEmpty}`} />
          </ul>
        </>
      ) : null}

      <Dialog open={sheet === "mes"} onClose={() => setSheet(null)} title="Mes">
        <ul className="choice-list">
          {monthNames().map((name, index) => (
            <li key={name}>
              <button
                type="button"
                className={grain === "month" && month === index + 1 ? "is-on" : undefined}
                onClick={() => {
                  setMonth(index + 1);
                  setGrain("month");
                  setSheet(null);
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
      <Dialog open={sheet === "anio"} onClose={() => setSheet(null)} title="Año">
        <ul className="choice-list">
          {yearChoices(today.year).map((value) => (
            <li key={value}>
              <button
                type="button"
                className={year === value ? "is-on" : undefined}
                onClick={() => {
                  setYear(value);
                  setGrain("year");
                  setSheet(null);
                }}
              >
                {value}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </section>
  );
}

function Trend({
  points,
  selected,
  onSelect,
  bars,
  valueOf,
}: {
  points: StatsPoint[];
  selected: number;
  onSelect: (index: number) => void;
  bars: boolean;
  valueOf: (point: StatsPoint) => number;
}) {
  if (points.length === 0) return <p className="lede">Sin pagos en este periodo.</p>;
  const max = Math.max(1, ...points.map(valueOf));
  const labels = axisLabels(points);
  const line = points
    .map((point, index) => {
      const x = ((index + 0.5) / points.length) * 100;
      const y = 100 - (valueOf(point) / max) * 88;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className={bars ? "trend is-bars" : "trend"}>
      <div className="trend-plot" role="listbox" aria-label={bars ? "Valor" : "Pagos"}>
        {bars ? null : (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={line} />
          </svg>
        )}
        {points.map((point, index) => {
          const ratio = valueOf(point) / max;
          return (
            <button
              key={point.key}
              type="button"
              role="option"
              aria-selected={index === selected}
              className={index === selected ? "is-on" : undefined}
              onClick={() => onSelect(index)}
              style={{ ["--rise" as string]: String(ratio) }}
            >
              <span />
            </button>
          );
        })}
      </div>
      <div className="trend-axis">
        {labels.map((label, index) => (
          <span key={`${points[index]?.key ?? index}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon,
  tint,
  label,
  value,
  valueTint,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
  valueTint?: string;
}) {
  return (
    <li>
      <span className={`metric-icon is-${tint}`}>{icon}</span>
      <span>{label}</span>
      <strong className={valueTint ? `is-${valueTint}` : undefined}>{value}</strong>
    </li>
  );
}

function Compare({ label, percent }: { label: string; percent: number | null }) {
  const down = percent != null && percent < 0;
  const up = percent != null && percent > 0;
  const tint = down ? "rose" : up ? "emerald" : "muted";
  return (
    <li>
      <span className={`metric-icon is-${tint}`}>{down ? <TrendDown size={16} /> : <TrendUp size={16} />}</span>
      <span>{label}</span>
      <strong className={percent == null || percent === 0 ? undefined : `badge is-${tint}`}>
        {percent == null ? "Sin pagos el periodo anterior" : signedPercent(percent)}
      </strong>
    </li>
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

function axisLabels(points: StatsPoint[]): string[] {
  if (points.length <= 12) return points.map((point) => point.label);
  return points.map((point, index) => {
    const day = Number(point.label);
    if (index === 0 || index === points.length - 1 || (Number.isFinite(day) && day % 5 === 0)) return point.label;
    return "";
  });
}

function yearChoices(current: number): number[] {
  const start = Math.min(FIRST_YEAR, current);
  const years: number[] = [];
  for (let value = current; value >= start; value -= 1) years.push(value);
  return years;
}

function countTipVisit(): boolean {
  try {
    if (localStorage.getItem(DISMISS_KEY) === "1") return false;
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0");
    if (visits >= 3) return false;
    localStorage.setItem(VISITS_KEY, String(visits + 1));
    return true;
  } catch {
    return false;
  }
}

function dismissTip() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* the tip can stay for this visit */
  }
}
