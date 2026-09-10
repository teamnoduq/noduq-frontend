import { SetupGate } from "@/components/setup-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organización",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <SetupGate>{children}</SetupGate>;
}
