"use client";

import { groupedInt } from "@/lib/calendar";
import { getPaymentHistory, type PaymentHistory } from "@/lib/payments";
import { Check, Clock } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

/** Feed matches Pagos on the phone. Account matches the Cuenta card: pending, running, and done. */
export function PaymentHistoryCard({
  token,
  planOn,
  onFinished,
  variant = "feed",
}: {
  token: string;
  planOn: boolean;
  onFinished: () => void;
  variant?: "feed" | "account";
}) {
  const [history, setHistory] = useState<PaymentHistory | null>(null);
  const finished = useRef(onFinished);
  const told = useRef(false);
  finished.current = onFinished;

  useEffect(() => {
    let alive = true;
    getPaymentHistory(token)
      .then((row) => {
        if (alive) setHistory(row);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (history?.status !== "running") return;
    let alive = true;
    const id = window.setInterval(() => {
      getPaymentHistory(token)
        .then((row) => {
          if (!alive) return;
          setHistory(row);
          if (row.status === "done" && !told.current) {
            told.current = true;
            finished.current();
          }
        })
        .catch(() => {});
    }, 2000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [token, history?.status]);

  const account = variant === "account";
  const smsCopy =
    "Los SMS del remitente del banco que ya están en el celular se traen desde la app de NODUQ. Los que ya están guardados no se repiten.";

  if (!account) {
    if (!planOn || !history || history.status === "missing" || history.status === "done") return null;
    return (
      <section className="history-card">
        <h2>Sincronización disponible</h2>
        <p>{smsCopy}</p>
      </section>
    );
  }

  const synced = (history?.paymentCount ?? 0) > 0;
  return (
    <section className="section">
      <div className="history-head">
        <h2>Sincronización de SMS</h2>
        <span className={synced ? "status-badge" : "status-badge is-wait"}>
          {synced ? "Sincronizado" : "Disponible"}
        </span>
      </div>
      {synced && history ? <SyncedHistory history={history} /> : <p className="lede">{smsCopy}</p>}
    </section>
  );
}

function SyncedHistory({ history }: { history: PaymentHistory }) {
  const count = history.paymentCount ?? 0;
  const listed = count === 1 ? "1 pago" : `${groupedInt(count)} pagos`;
  const day = bogotaLabel(history.lastStoredAt, "long");
  const time = bogotaLabel(history.lastStoredAt, "time");
  const stamp = day && time ? `${day}, ${time}` : day;
  return (
    <ul className="history-done">
      <li style={metricRow}>
        <span style={metricIcon} aria-hidden="true">
          <Check size={15} weight="bold" />
        </span>
        {listed}
      </li>
      {stamp ? (
        <li style={metricRow}>
          <span style={metricIcon} aria-hidden="true">
            <Clock size={15} weight="bold" />
          </span>
          {stamp}
        </li>
      ) : null}
    </ul>
  );
}

const metricRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#fff",
  fontWeight: 550,
} as const;

const metricIcon = {
  display: "grid",
  placeItems: "center",
  width: 28,
  height: 28,
  borderRadius: 99,
  background: "color-mix(in srgb, var(--cian) 12%, transparent)",
  color: "var(--cian)",
  flex: "none",
} as const;

function bogotaLabel(iso: string | null | undefined, style: "day" | "long" | "time"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const options: Intl.DateTimeFormatOptions =
    style === "day"
      ? { day: "numeric", month: "short" }
      : style === "time"
        ? { hour: "numeric", minute: "2-digit" }
        : { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("es-CO", { ...options, timeZone: "America/Bogota" })
    .format(date)
    .replace(/\./g, "");
}

