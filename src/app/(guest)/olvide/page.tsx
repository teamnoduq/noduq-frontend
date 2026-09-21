"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, TextInput } from "@/components/ui";
import { MailSentView } from "@/components/mail-sent";
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
        {done ? (
          <MailSentView
            icon="key"
            title="Te enviamos las instrucciones"
            primary="Volver a iniciar sesión"
            primaryHref="/login"
            secondary="¿No recibiste el enlace? Intentar de nuevo"
            onSecondary={() => resetPassword(email.trim())}
          >
            Si el correo está registrado en NODUQ, recibirás un enlace para crear una nueva
            contraseña en <strong>{email.trim()}</strong>.
          </MailSentView>
        ) : (
          <>
            <h1>Restablecer contraseña</h1>
            <p className="auth-lede">
              Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>
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
            <p className="auth-switch">
              <Link href="/login">Volver a entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
