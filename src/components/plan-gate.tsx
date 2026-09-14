"use client";

import { useAuth } from "@/components/auth-provider";
import { BootScreen } from "@/components/boot-screen";
import { Banner, Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PlanGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { kind, loading: authLoading } = useAuth();
  const { provisioned, hasPlan, loading: workspaceLoading, error, refresh } = useWorkspace();

  useEffect(() => {
    if (authLoading) return;
    if (!kind) {
      router.replace("/login");
      return;
    }
    if (kind === "employee") {
      router.replace("/");
      return;
    }
    if (workspaceLoading) return;
    if (error) return;
    if (!provisioned) {
      router.replace("/setup");
      return;
    }
    if (hasPlan) router.replace("/");
  }, [authLoading, kind, workspaceLoading, provisioned, hasPlan, error, router]);

  if (authLoading || (kind === "owner" && workspaceLoading)) {
    return <BootScreen label="Cargando…" />;
  }
  if (!kind || kind === "employee") return <BootScreen />;
  if (error) {
    return (
      <div className="auth-stage">
        <div className="auth-card">
          <Banner>
            {error}
            <div className="banner-actions">
              <Button type="button" variant="ghost" onClick={() => void refresh()}>
                Reintentar
              </Button>
            </div>
          </Banner>
        </div>
      </div>
    );
  }
  if (!provisioned || hasPlan) return <BootScreen />;
  return <>{children}</>;
}
