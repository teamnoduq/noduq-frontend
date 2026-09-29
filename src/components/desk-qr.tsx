"use client";

import { useAuth } from "@/components/auth-provider";
import { issueDeskTicket, pollDeskTicket } from "@/lib/identity";
import { ArrowRight } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const FALLBACK_LIFE_MS = 30_000;
const POLL_MS = 1_200;

export function DeskQr() {
  const { completeDeskLogin } = useAuth();
  const [markup, setMarkup] = useState("");
  const [generation, setGeneration] = useState(0);
  const [lifeMs, setLifeMs] = useState(FALLBACK_LIFE_MS);
  const [status, setStatus] = useState("El código se actualiza periódicamente.");
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    let alive = true;
    let pollTimer = 0;
    let refreshTimer = 0;
    let claimed = false;

    async function paint(payload: string) {
      const svg = await QRCode.toString(payload, {
        type: "svg",
        margin: 1,
        width: 188,
        color: { dark: "#021113", light: "#d3f6fb" },
        errorCorrectionLevel: "M",
      });
      if (!alive) return;
      setMarkup(svg);
      setGeneration((current) => current + 1);
    }

    async function issue() {
      if (claimed) return;
      try {
        const ticket = await issueDeskTicket();
        if (!alive || claimed) return;
        const until = Date.parse(ticket.expiresAt);
        const remaining = Number.isFinite(until) ? Math.max(4_000, until - Date.now()) : FALLBACK_LIFE_MS;
        setLifeMs(remaining);
        setStatus("El código se actualiza periódicamente.");
        await paint(ticket.payload);
        window.clearInterval(pollTimer);
        pollTimer = window.setInterval(() => {
          void poll(ticket.id, ticket.secret);
        }, POLL_MS);
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          void issue();
        }, remaining);
      } catch {
        if (!alive || claimed) return;
        setStatus("No se pudo crear el código. Reintentando…");
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => {
          void issue();
        }, 2_000);
      }
    }

    async function poll(id: string, secret: string) {
      if (!alive || claimed) return;
      try {
        const next = await pollDeskTicket(id, secret);
        if (!alive || claimed) return;
        if (next.status === "expired") {
          window.clearInterval(pollTimer);
          void issue();
          return;
        }
        if (next.status !== "claimed") return;
        claimed = true;
        window.clearInterval(pollTimer);
        window.clearTimeout(refreshTimer);
        setEntering(true);
        setStatus("Entrando…");
        try {
          await completeDeskLogin(next);
        } catch (err) {
          if (!alive) return;
          claimed = false;
          setEntering(false);
          setStatus(err instanceof Error ? err.message : "No se pudo entrar con el código.");
          void issue();
        }
      } catch {
        /* keep polling */
      }
    }

    void issue();
    return () => {
      alive = false;
      window.clearInterval(pollTimer);
      window.clearTimeout(refreshTimer);
    };
  }, [completeDeskLogin]);

  return (
    <div className="desk-qr">
      <div className="desk-qr-frame" aria-hidden={markup ? undefined : true}>
        {markup ? (
          <div key={generation} className="desk-qr-mark" dangerouslySetInnerHTML={{ __html: markup }} />
        ) : (
          <span className="spinner" />
        )}
      </div>
      <p className="desk-qr-steps">
        <span>1. Abre NODUQ en tu móvil</span>
        <ArrowRight size={14} aria-hidden="true" />
        <span>2. Ve a Cuenta &gt; Escanear QR</span>
      </p>
      <div className="desk-qr-meter" aria-hidden="true">
        <i key={generation} style={{ animationDuration: `${lifeMs}ms` }} />
      </div>
      <p className="desk-qr-status" role="status">
        {entering ? "Entrando…" : status}
      </p>
    </div>
  );
}
