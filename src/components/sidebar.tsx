"use client";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { useWorkspace } from "@/components/workspace-provider";
import {
  IdentificationCard,
  QrCode,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const OWNER_NAV = [
  { href: "/", label: "Pagos", icon: QrCode },
  { href: "/empleados", label: "Empleados", icon: UsersThree },
  { href: "/cuenta", label: "Cuenta", icon: IdentificationCard },
];

const EMPLOYEE_NAV = [
  { href: "/", label: "Pagos", icon: QrCode },
  { href: "/cuenta", label: "Cuenta", icon: IdentificationCard },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { kind } = useAuth();
  const { workspace } = useWorkspace();
  const org = workspace?.organization.name;
  const nav = kind === "employee" ? EMPLOYEE_NAV : OWNER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
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
              <Icon size={18} weight={active ? "fill" : "regular"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
