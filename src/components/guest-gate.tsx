"use client";

import { useAuth } from "@/components/auth-provider";
import { BootScreen } from "@/components/boot-screen";
import { Banner, Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function GuestGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { kind, loading: authLoading } = useAuth();
  const { provisioned, loading: workspaceLoading, error, refresh } = useWorkspace();

  useEffect(() => {
    if (authLoading) return;
    if (!kind) return;
    if (workspaceLoading) return;
    if (error) return;
    if (kind === "employee") {
      router.replace("/");
      return;
    }
    router.replace(provisioned ? "/" : "/setup");
  }, [authLoading, kind, workspaceLoading, provisioned, error, router]);

  if (authLoading) return <BootScreen />;
  if (kind && workspaceLoading) return <BootScreen label="Cargando…" />;
  if (kind && error) {
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
  if (kind) return <BootScreen />;
  return <>{children}</>;
}
