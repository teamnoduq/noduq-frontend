"use client";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { BootScreen } from "@/components/boot-screen";
import { Banner, Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AppGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { kind, loading: authLoading } = useAuth();
  const { provisioned, loading: workspaceLoading, error, refresh } = useWorkspace();

  useEffect(() => {
    if (authLoading) return;
    if (!kind) {
      router.replace("/login");
      return;
    }
    if (workspaceLoading) return;
    if (error) return;
    if (kind === "owner" && !provisioned) router.replace("/setup");
  }, [authLoading, kind, workspaceLoading, provisioned, error, router]);

  if (authLoading || (kind && workspaceLoading)) {
    return <BootScreen label="Cargando…" />;
  }
  if (!kind) return <BootScreen />;
  if (error) {
    return (
      <div className="boot">
        <div className="auth-card">
          <Banner>
            {error}
            <div className="banner-actions">
              <Button type="button" onClick={() => void refresh()}>
                Reintentar
              </Button>
            </div>
          </Banner>
        </div>
      </div>
    );
  }
  if (kind === "owner" && !provisioned) return <BootScreen />;
  return <AppShell>{children}</AppShell>;
}
