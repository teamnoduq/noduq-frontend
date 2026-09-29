"use client";

import { Button } from "@/components/ui";
import { Receipt } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function PlanInactive() {
  const router = useRouter();
  return (
    <div className="wait wait-muted">
      <span className="empty-receipt" aria-hidden="true">
        <Receipt size={28} weight="fill" />
      </span>
      <h2>Validación automática inactiva</h2>
      <p>
        Activa tu plan para que NODUQ valide los pagos por QR y notifique a tu equipo en tiempo
        real.
      </p>
      <div className="row-actions">
        <Button type="button" onClick={() => router.push("/plan")}>
          Activar plan · $24.900/mes
        </Button>
      </div>
    </div>
  );
}
