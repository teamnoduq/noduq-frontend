"use client";

import { Button } from "@/components/ui";
import { gmailConnect, gmailStatus, type GmailStatus } from "@/lib/gmail";
import { groupedInt } from "@/lib/calendar";
import {
  deferPaymentHistory,
  getPaymentHistory,
  startPaymentHistory,
  type PaymentHistory,
} from "@/lib/payments";
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
  const [mail, setMail] = useState<GmailStatus | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  const askMail =
    planOn && (history?.status === "available" || (account && history?.status === "deferred"));

  useEffect(() => {
    if (!askMail) return;
    let alive = true;
    gmailStatus(token)
      .then((row) => {
        if (alive) setMail(row);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, askMail]);

  async function onStart() {
    setNote(null);
    if (!planOn) {
      setNote("Activa el plan para traer el histórico.");
      return;
    }
    setBusy(true);
    try {
      const status = mail ?? (await gmailStatus(token));
      setMail(status);
      if (!status.connected) {
        if (!status.configured) {
          setNote("El servidor todavía no tiene el cliente de Gmail.");
          return;
        }
        const connect = await gmailConnect(token);
        window.location.assign(connect.authorizationUrl);
        return;
      }
      const next = await startPaymentHistory(token);
      setHistory(next);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "No se pudo empezar el histórico.");
    } finally {
      setBusy(false);
    }
  }

  async function onSkip() {
    setNote(null);
    setBusy(true);
    try {
      setHistory(await deferPaymentHistory(token));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "No se pudo dejar el histórico para después.");
    } finally {
      setBusy(false);
    }
  }

  if (!history || history.status === "missing") return null;
  if (!account) {
    if (history.status === "running") {
      return <HistoryProgress history={history} note={note} onDismissNote={() => setNote(null)} />;
    }
    if (!planOn || history.status !== "available") return null;
    return (
      <section className="history-card">
        <h2>Traer el histórico de pagos</h2>
        <p>Revisa todo el correo del banco, de a pocos, y se queda solo con los pagos por QR. Una sola vez.</p>
        {note ? <HistoryNote note={note} onDismiss={() => setNote(null)} /> : null}
        <StartButton busy={busy} connected={mail?.connected === true} onClick={() => void onStart()} />
        <button type="button" className="auth-quiet" disabled={busy} onClick={() => void onSkip()}>
          Omitir por ahora
        </button>
      </section>
    );
  }

  const done = history.status === "done";
  const subtitle =
    history.status === "running"
      ? history.total > 0
        ? "Guardando los pagos del correo."
        : "Buscando en todo el correo del banco."
      : done
        ? null
        : history.status === "deferred"
          ? "Lo dejaste para después. Revisa todo el correo del banco, de a pocos. Una sola vez."
          : "Pendiente. Revisa todo el correo del banco, de a pocos. Una sola vez.";

  return (
    <section className="section">
      <div className="history-head">
        <h2>Histórico de pagos</h2>
        {done ? <span className="status-badge">Sincronizado</span> : null}
      </div>
      {subtitle ? <p className="lede">{subtitle}</p> : null}
      {history.status === "running" ? (
        <HistoryProgress history={history} note={note} onDismissNote={() => setNote(null)} />
      ) : null}
      {done ? <SyncedHistory history={history} /> : null}
      {!done && history.status !== "running" ? (
        planOn ? (
          <>
            {note ? <HistoryNote note={note} onDismiss={() => setNote(null)} /> : null}
            <StartButton busy={busy} connected={mail?.connected === true} onClick={() => void onStart()} />
          </>
        ) : (
          <p className="lede">Activa el plan para traerlo.</p>
        )
      ) : null}
    </section>
  );
}

function StartButton({
  busy,
  connected,
  onClick,
}: {
  busy: boolean;
  connected: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" className="btn-block" loading={busy} onClick={onClick}>
      {connected ? "Empezar" : "Conectar correo"}
    </Button>
  );
}

function HistoryProgress({
  history,
  note,
  onDismissNote,
}: {
  history: PaymentHistory;
  note: string | null;
  onDismissNote: () => void;
}) {
  const listing = history.total <= 0;
  const percent = Math.min(100, Math.max(0, history.percent));
  const walked = Math.max(0, history.processed);
  return (
    <section className="history-card" aria-live="polite">
      <h2>{listing ? "Buscando en el correo…" : `Guardando pagos... ${percent}%`}</h2>
      <div className={listing ? "history-bar is-busy" : "history-bar"} aria-hidden="true">
        <span style={listing ? undefined : { width: `${percent}%` }} />
      </div>
      <p>
        {listing
          ? walked > 0
            ? `Procesando ${groupedInt(walked)} pagos`
            : "Revisando el correo del banco…"
          : `Procesando ${groupedInt(walked)} de ${groupedInt(history.total)} pagos`}
      </p>
      {note ? <HistoryNote note={note} onDismiss={onDismissNote} /> : null}
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

function HistoryNote({ note, onDismiss }: { note: string; onDismiss: () => void }) {
  return (
    <p className="history-note">
      {note}{" "}
      <button type="button" onClick={onDismiss}>
        Cerrar
      </button>
    </p>
  );
}
