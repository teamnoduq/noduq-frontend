"use client";

import { Sidebar } from "@/components/sidebar";
import { List, X } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="desk">
      <button
        type="button"
        className="menu-btn"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
      </button>

      <div className={open ? "sidebar-slot is-open" : "sidebar-slot"}>
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      {open ? (
        <button
          type="button"
          className="scrim"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="canvas">{children}</main>
    </div>
  );
}
