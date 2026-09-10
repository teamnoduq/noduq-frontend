"use client";

import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/toast";
import { WorkspaceProvider } from "@/components/workspace-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ToastProvider>{children}</ToastProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
