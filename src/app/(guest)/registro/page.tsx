"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, PasswordInput, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegistroPage() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
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
        setInfo("Revisa tu correo para confirmar la cuenta. Luego vuelve a entrar.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>Crear cuenta</h1>
        <p className="auth-lede">
          Correo y contraseña. Después el nombre de la organización. Si ya te dieron usuario y
          código, <Link href="/login#empleado">entra aquí</Link>.
        </p>
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
              disabled={submitting}
            />
          </Field>
          <Field id="password" label="Contraseña" hint="Mínimo 6 caracteres.">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </Field>
          <Field id="confirm" label="Repite la contraseña">
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
          </Field>
          {error ? <Banner>{error}</Banner> : null}
          {info ? <Banner tone="ok">{info}</Banner> : null}
          <Button type="submit" className="btn-block" loading={submitting}>
            {submitting ? "Creando…" : "Crear cuenta"}
          </Button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
