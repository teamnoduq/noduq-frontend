"use client";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { MenuPopover } from "@/components/dropdown";
import { useWorkspace } from "@/components/workspace-provider";
import { roleLabel } from "@/lib/names";
import {
  CaretUp,
  ChartBar,
  IdentificationCard,
  QrCode,
  SignOut,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const OWNER_NAV = [
  { href: "/", label: "Pagos", icon: QrCode },
  { href: "/empleados", label: "Empleados", icon: UsersThree },
  { href: "/estadisticas", label: "Estadísticas", icon: ChartBar },
];

const EMPLOYEE_NAV = [{ href: "/", label: "Pagos", icon: QrCode }];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { kind, employeeSession, signOut, user } = useAuth();
  const { workspace } = useWorkspace();
  const org = workspace?.organization.name ?? employeeSession?.organization.name ?? "";
  const person =
    kind === "employee"
      ? employeeSession?.employee.displayName
      : workspace?.profile.displayName || user?.email;
  const name = person?.trim() || "Cuenta";
  const nav = kind === "employee" ? EMPLOYEE_NAV : OWNER_NAV;
  const role = roleLabel(kind);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Brand compact />
        {org ? <p className="sidebar-org">{org}</p> : null}
      </div>

      <nav className="sidebar-nav" aria-label="Panel">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "nav-link is-active" : "nav-link"}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon size={20} weight="regular" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <MenuPopover
        ariaLabel="Opciones de cuenta"
        triggerClassName={pathname.startsWith("/cuenta") ? "account-btn is-on" : "account-btn"}
        rise
        block
        trigger={
          <>
            <div className="account-meta">
              <strong>{name}</strong>
              <span>{role}</span>
            </div>
            <CaretUp size={16} weight="bold" aria-hidden="true" />
          </>
        }
      >
        <Link href="/cuenta" role="menuitem" onClick={onNavigate}>
          <IdentificationCard size={18} />
          Cuenta
        </Link>
        <button type="button" role="menuitem" onClick={() => void signOut()}>
          <SignOut size={18} />
          Cerrar sesión
        </button>
      </MenuPopover>
    </aside>
  );
}
