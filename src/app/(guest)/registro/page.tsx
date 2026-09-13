"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, PasswordInput, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegistroPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [waitingMail, setWaitingMail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const mail = email.trim();
    if (!mail) {
      setError("Escribe un correo.");
      return;
    }
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
      const { needsConfirm } = await signUp(mail, password);
      if (needsConfirm) {
        setWaitingMail(mail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar con Google.");
      setGoogleLoading(false);
    }
  }

  if (waitingMail) {
    return (
      <div className="auth-stage">
        <div className="auth-card">
          <Brand />
          <p className="auth-kicker">Correo</p>
          <h1>Confirma tu cuenta</h1>
          <p className="auth-lede">
            Te escribimos a <strong>{waitingMail}</strong> desde NODUQ. Abre el enlace de ese
            mensaje (no uno viejo) y vuelve a entrar.
          </p>
          <p className="auth-switch">
            ¿Ya confirmaste? <Link href="/login">Entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>Crea tu cuenta</h1>
        <p className="auth-lede">Después armamos el comercio. El aviso de pago sale de Bancolombia, no de un número que tengas que copiar.</p>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <Field id="email" label="Correo">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || googleLoading}
            />
          </Field>
          <Field id="password" label="Contraseña" hint="Mínimo 6 caracteres.">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || googleLoading}
            />
          </Field>
          <Field id="confirm" label="Repite la contraseña">
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting || googleLoading}
            />
          </Field>
          {error ? <Banner>{error}</Banner> : null}
          <Button type="submit" className="btn-block" loading={submitting}>
            {submitting ? "Creando…" : "Crear cuenta"}
          </Button>
          <p className="auth-or">o</p>
          <button
            type="button"
            className="btn-google"
            onClick={() => void onGoogle()}
            disabled={submitting || googleLoading}
          >
            {googleLoading ? "Abriendo Google…" : "Continuar con Google"}
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
