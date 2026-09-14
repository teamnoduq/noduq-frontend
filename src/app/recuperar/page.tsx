"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, PasswordInput } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseAuthMessage } from "@/lib/auth-messages";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function RecoverPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
      router.replace("/");
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
        <h1>Nueva contraseña</h1>
        <p className="auth-lede">Elige una clave nueva para esta cuenta.</p>
        {!ready ? null : (
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
