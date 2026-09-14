"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail) {
      setError("Escribe el correo.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(mail);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el enlace.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>Restablecer contraseña</h1>
        <p className="auth-lede">Te escribimos un enlace. Lo abres y eliges la clave nueva.</p>
        {done ? (
          <Banner>Revisa el correo. Si no llega, mira en spam.</Banner>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <Field id="email" label="Correo">
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </Field>
            {error ? <Banner>{error}</Banner> : null}
            <Button type="submit" className="btn-block" loading={submitting}>
              Enviar enlace
            </Button>
          </form>
        )}
        <p className="auth-switch">
          <Link href="/login">Volver a entrar</Link>
        </p>
      </div>
    </div>
  );
}
