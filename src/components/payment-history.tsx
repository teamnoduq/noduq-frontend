"use client";

import { groupedInt } from "@/lib/calendar";
import { getPaymentHistory, type PaymentHistory } from "@/lib/payments";
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

  return (
    <section className="section">
      <div className="history-head">
        <h2>Sincronización de SMS</h2>
        <span className="status-badge">Disponible</span>
      </div>
      <p className="lede">{smsCopy}</p>
      {history?.status === "done" ? <SyncedHistory history={history} /> : null}
    </section>
  );
}

function SyncedHistory({ history }: { history: PaymentHistory }) {
  const listed = history.stored === 1 ? "1 pago listado" : `${groupedInt(history.stored)} pagos listados`;
  const since = bogotaLabel(history.earliestAt, "day");
  const day = bogotaLabel(history.finishedAt, "long");
  const time = bogotaLabel(history.finishedAt, "time");
  const stamp = day && time ? `${day}, ${time}` : day;
  return (
    <ul className="history-done">
      <li>{listed}</li>
      {since ? <li>Desde {since}</li> : null}
      {stamp ? <li>{stamp}</li> : null}
    </ul>
  );
}

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

