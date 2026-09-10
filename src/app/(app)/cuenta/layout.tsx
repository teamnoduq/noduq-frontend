import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cuenta",
};

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
