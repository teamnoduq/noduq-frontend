import { PlanGate } from "@/components/plan-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan",
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <PlanGate>{children}</PlanGate>;
}
