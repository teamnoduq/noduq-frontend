"use client";

import { isNotProvisioned } from "@/lib/api";
import { getMe, workspaceFromEmployee } from "@/lib/identity";
import type { Workspace } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type WorkspaceContextValue = {
  workspace: Workspace | null;
  provisioned: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyWorkspace: (workspace: Workspace) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { kind, accessToken, employeeSession, loading: authLoading } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [provisioned, setProvisioned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (kind === "employee" && employeeSession) {
      setWorkspace(workspaceFromEmployee(employeeSession));
      setProvisioned(true);
      setError(null);
      setLoading(false);
      setReady(true);
      return;
    }
    if (kind !== "owner" || !accessToken) {
      setWorkspace(null);
      setProvisioned(false);
      setError(null);
      setLoading(false);
      setReady(true);
      return;
    }
    setReady(false);
    setLoading(true);
    setError(null);
    try {
      const next = await getMe(accessToken);
      setWorkspace(next);
      setProvisioned(true);
    } catch (err) {
      if (isNotProvisioned(err)) {
        setWorkspace(null);
        setProvisioned(false);
        setError(null);
        return;
      }
      setWorkspace(null);
      setProvisioned(false);
      setError(err instanceof Error ? err.message : "No se pudo cargar la cuenta.");
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [kind, accessToken, employeeSession]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [accessToken, authLoading, kind, refresh]);

  const applyWorkspace = useCallback((next: Workspace) => {
    setWorkspace(next);
    setProvisioned(true);
    setError(null);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      provisioned,
      loading: authLoading || !ready || loading,
      error,
      refresh,
      applyWorkspace,
    }),
    [workspace, provisioned, authLoading, ready, loading, error, refresh, applyWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider");
  return ctx;
}
