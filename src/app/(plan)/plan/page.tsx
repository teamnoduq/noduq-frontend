"use client";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { Banner, Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { activatePlan } from "@/lib/identity";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlanPage() {
  const router = useRouter();
  const { accessToken, signOut } = useAuth();
  const { workspace, applyWorkspace } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onBuy() {
    const orgId = workspace?.organization.id;
    if (!orgId || !accessToken || !workspace) {
      setError("La sesión se cerró. Vuelve a entrar.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const plan = await activatePlan(accessToken);
      applyWorkspace({ ...workspace, plan });
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo activar el plan.";
      if (message.toLowerCase().includes("cancel")) {
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <p className="auth-kicker">Plan</p>
        <h1>Activa NODUQ</h1>
        <p className="auth-lede">
          Los SMS del remitente del banco. $24.900 al mes. Si sales ahora, volvemos aquí
          hasta que el plan quede activo.
        </p>
        <p className="plan-price">Android · SMS</p>
        {error ? <Banner>{error}</Banner> : null}
        <Button type="button" className="btn-block" loading={busy} onClick={() => void onBuy()}>
          {busy ? "Activando…" : "Activar plan"}
        </Button>
        <button type="button" className="auth-quiet" onClick={() => void signOut()}>
          Salir
        </button>
      </div>
    </div>
  );
}
