"use client";

import { useAuth } from "@/components/auth-provider";
import { BootScreen } from "@/components/boot-screen";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OwnerGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { kind, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (kind === "employee") router.replace("/");
  }, [kind, loading, router]);

  if (loading || kind === "employee") return <BootScreen />;
  return <>{children}</>;
}
