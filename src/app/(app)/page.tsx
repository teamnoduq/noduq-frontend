"use client";

import { useAuth } from "@/components/auth-provider";
import { Banner, Button, Field, TextInput } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { listPayments } from "@/lib/payments";
import type { PaymentNotice } from "@/lib/types";
import { FormEvent, useCallback, useEffect, useState } from "react";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function sourceLabel(source: string): string {
  if (source === "email") return "Correo";
  if (source === "sms") return "SMS";
  return source;
}

function bogotaStart(date: string): string {
  return new Date(`${date}T00:00:00-05:00`).toISOString();
}

function bogotaNext(date: string): string {
  return new Date(new Date(`${date}T00:00:00-05:00`).getTime() + 86_400_000).toISOString();
}

type Filters = { q: string; source: string; since: string; until: string };

const EMPTY_FILTERS: Filters = { q: "", source: "", since: "", until: "" };

export default function PagosPage() {
  const { accessToken, kind } = useAuth();
  const { workspace } = useWorkspace();
  const org = workspace?.organization.name;
  const employee = kind === "employee";
  const [notices, setNotices] = useState<PaymentNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const feed = await listPayments(
        accessToken,
        employee
          ? { limit: 100 }
          : {
              limit: 100,
              q: applied.q.trim() || undefined,
              source: applied.source || undefined,
              since: applied.since ? bogotaStart(applied.since) : undefined,
              until: applied.until ? bogotaNext(applied.until) : undefined,
            },
        employee,
      );
      setNotices(feed.notices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los avisos.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, employee, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied({ ...draft });
  }

  const filtering =
    !employee && (applied.q.trim() !== "" || applied.source !== "" || applied.since !== "" || applied.until !== "");

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Pagos</h1>
          <p className="lede">
            Aquí llega el aviso cuando confirmen el QR de Bancolombia. NODUQ lee el mensaje tal
            cual llega, de los remitentes del banco.
          </p>
        </div>
      </header>

      {!employee ? (
        <form className="pay-filters" onSubmit={onFilter}>
          <Field id="pay-q" label="Quién pagó">
            <TextInput
              id="pay-q"
              value={draft.q}
              onChange={(e) => setDraft((current) => ({ ...current, q: e.target.value }))}
              placeholder="Nombre"
            />
          </Field>
          <Field id="pay-source" label="Origen">
            <div className="chip-row" role="group" aria-label="Origen del aviso">
              {[
                { id: "", label: "Todos" },
                { id: "sms", label: "SMS" },
                { id: "email", label: "Correo" },
              ].map((option) => (
                <button
                  key={option.id || "all"}
                  type="button"
                  className={draft.source === option.id ? "chip is-on" : "chip"}
                  onClick={() => setDraft((current) => ({ ...current, source: option.id }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>
          <Field id="pay-since" label="Desde">
            <TextInput
              id="pay-since"
              type="date"
              value={draft.since}
              onChange={(e) => setDraft((current) => ({ ...current, since: e.target.value }))}
            />
          </Field>
          <Field id="pay-until" label="Hasta">
            <TextInput
              id="pay-until"
              type="date"
              value={draft.until}
              onChange={(e) => setDraft((current) => ({ ...current, until: e.target.value }))}
            />
          </Field>
          <div className="pay-filter-actions">
            <Button type="submit">Filtrar</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(EMPTY_FILTERS);
                setApplied(EMPTY_FILTERS);
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>
      ) : null}

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
        filtering ? (
          <div className="empty-box">Ningún aviso con esos filtros.</div>
        ) : (
          <div className="wait">
            <QrFinder />
            <h2>
              <span className="pulse" aria-hidden="true" />
              Todavía no hay avisos
            </h2>
            <p>
              Cuando paguen el QR, el aviso aparece aquí
              {org ? ` en ${org}` : ""}. NODUQ lo muestra; no hace falta el comprobante que manda el
              cliente.
            </p>
          </div>
        )
      ) : (
        <div className="pay-table-wrap">
          <table className="pay-table">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Quién</th>
                <th>Monto</th>
                <th>Origen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id}>
                  <td>{formatWhen(notice.occurredAt ?? notice.receivedAt)}</td>
                  <td>
                    {notice.payerName ?? (notice.readable ? "—" : "Sin leer")}
                    {!notice.readable ? (
                      <div className="pay-note">El banco avisó, pero no se pudieron leer nombre ni monto.</div>
                    ) : null}
                  </td>
                  <td className="pay-amount">{notice.amountLabel ?? "—"}</td>
                  <td>{sourceLabel(notice.source)}</td>
                  <td>
                    {notice.confirmedByEmail ? (
                      <span className="badge badge-on">Verificado</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function QrFinder() {
  return (
    <svg className="finder" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M8 22V12h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 22V12H54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 50v10h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 50v10H54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="22" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="38" y="22" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="22" y="38" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="40" y="40" width="8" height="8" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
