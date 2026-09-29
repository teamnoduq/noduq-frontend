import { OwnerGate } from "@/components/owner-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estadísticas",
};

export default function EstadisticasLayout({ children }: { children: React.ReactNode }) {
  return <OwnerGate>{children}</OwnerGate>;
}
