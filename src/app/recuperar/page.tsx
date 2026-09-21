"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, PasswordInput } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseAuthMessage } from "@/lib/auth-messages";
import { authTypeFromLocation, noduqAppAuthHref, openNoduqApp } from "@/lib/noduq-app-link";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function RecoverPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [appHref, setAppHref] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authTypeFromLocation() === "signup") {
      window.location.replace(`/confirmar${window.location.search}${window.location.hash}`);
      return;
    }

    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) {
        setError("El enlace expiró o ya se usó. Pide uno nuevo.");
      }
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(supabaseAuthMessage(updateError));
      const href = noduqAppAuthHref({ type: "recovery" });
      setAppHref(href);
      openNoduqApp(href);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la clave.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>{done ? "Clave lista" : "Nueva contraseña"}</h1>
        <p className="auth-lede">
          {done
            ? "Entra otra vez en la app con esta clave. El panel web, si ya estaba abierto, sigue."
            : "Elige una clave nueva para esta cuenta."}
        </p>
        {done ? (
          <>
            {appHref ? (
              <p>
                <a className="btn btn-primary btn-block" href={appHref}>
                  Abrir la app
                </a>
              </p>
            ) : null}
            <p className="auth-switch">
              <button
                type="button"
                onClick={() => {
                  void supabase.auth.signOut({ scope: "local" }).finally(() => {
                    window.location.assign("/login");
                  });
                }}
              >
                Ir a iniciar sesión
              </button>
            </p>
          </>
        ) : !ready ? null : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <Field id="password" label="Contraseña">
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </Field>
            <Field id="confirm" label="Repite la contraseña">
              <PasswordInput
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
              />
            </Field>
            {error ? <Banner>{error}</Banner> : null}
            <Button type="submit" className="btn-block" loading={submitting}>
              Guardar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
