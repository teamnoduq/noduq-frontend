"use client";

import { getSupabase } from "@/lib/supabase";
import { supabaseAuthMessage } from "@/lib/auth-messages";
import {
  createEmployeeSession,
  deleteEmployeeSession,
  getEmployeeMe,
} from "@/lib/identity";
import type { EmployeeSessionPayload } from "@/lib/types";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPLOYEE_TOKEN_KEY = "noduq.employee.token.v1";

export type AuthKind = "owner" | "employee";

type AuthContextValue = {
  kind: AuthKind | null;
  session: Session | null;
  user: User | null;
  employeeSession: EmployeeSessionPayload | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInEmployee: (username: string, code: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readEmployeeToken(): string | null {
  try {
    return window.localStorage.getItem(EMPLOYEE_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeEmployeeToken(token: string) {
  window.localStorage.setItem(EMPLOYEE_TOKEN_KEY, token);
}

function clearEmployeeToken() {
  try {
    window.localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const [kind, setKind] = useState<AuthKind | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employeeSession, setEmployeeSession] = useState<EmployeeSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data.session) {
        clearEmployeeToken();
        setEmployeeSession(null);
        setKind("owner");
        setSession(data.session);
        setLoading(false);
        return;
      }

      const stored = readEmployeeToken();
      if (!stored) {
        setKind(null);
        setSession(null);
        setEmployeeSession(null);
        setLoading(false);
        return;
      }

      try {
        const me = await getEmployeeMe(stored);
        if (!alive) return;
        writeEmployeeToken(me.token);
        setEmployeeSession(me);
        setKind("employee");
        setSession(null);
      } catch {
        clearEmployeeToken();
        if (alive) {
          setKind(null);
          setEmployeeSession(null);
          setSession(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void boot();

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      if (next) {
        clearEmployeeToken();
        setEmployeeSession(null);
        setKind("owner");
        setSession(next);
        setLoading(false);
        return;
      }
      setSession(null);
      setKind((current) => (current === "owner" ? null : current));
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      clearEmployeeToken();
      setEmployeeSession(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(supabaseAuthMessage(error));
    },
    [supabase],
  );

  const signInEmployee = useCallback(
    async (username: string, code: string) => {
      const opened = await createEmployeeSession({ username, code });
      writeEmployeeToken(opened.token);
      setEmployeeSession(opened);
      setKind("employee");
      setSession(null);
      await supabase.auth.signOut();
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(supabaseAuthMessage(error));
      return { needsConfirm: !data.session };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    const token = employeeSession?.token;
    const current = kind;
    clearEmployeeToken();
    setEmployeeSession(null);
    if (current === "employee") {
      setKind(null);
      if (token) {
        try {
          await deleteEmployeeSession(token);
        } catch {
          /* already closed */
        }
      }
      return;
    }
    await supabase.auth.signOut();
  }, [employeeSession?.token, kind, supabase]);

  const accessToken =
    kind === "owner" ? (session?.access_token ?? null) : kind === "employee" ? (employeeSession?.token ?? null) : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      kind,
      session,
      user: session?.user ?? null,
      employeeSession,
      accessToken,
      loading,
      signIn,
      signInEmployee,
      signUp,
      signOut,
    }),
    [kind, session, employeeSession, accessToken, loading, signIn, signInEmployee, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
