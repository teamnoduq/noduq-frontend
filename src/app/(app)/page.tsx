"use client";

import { useWorkspace } from "@/components/workspace-provider";

export default function PagosPage() {
  const { workspace } = useWorkspace();
  const org = workspace?.organization.name;

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Pagos</h1>
          <p className="lede">
            Aquí llega el aviso cuando confirmen el QR de Bancolombia. Todavía no hay ingest: esta
            pantalla espera de verdad.
          </p>
        </div>
      </header>

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
