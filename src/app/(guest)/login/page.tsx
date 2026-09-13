"use client";

import { Brand } from "@/components/brand";
import { Banner, Button, Field, ModeSwitch, PasswordInput, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const MODES = [
  { id: "account", label: "Cuenta" },
  { id: "employee", label: "Empleado" },
];

export default function LoginPage() {
  const { signIn, signInEmployee, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#empleado") setMode("employee");
  }, []);

  function switchMode(next: string) {
    setMode(next);
    setError(null);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (mode === "employee") {
      const user = username.trim();
      if (!user || !code) {
        setError("Escribe el usuario y el código.");
        return;
      }
      setSubmitting(true);
      try {
        await signInEmployee(user, code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo entrar.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const mail = email.trim();
    if (!mail || !password) {
      setError("Escribe el correo y la contraseña.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(mail, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>Entrar</h1>
        <p className="auth-lede">
          {mode === "employee" ? "Usa tus datos para continuar." : "Accede a tu cuenta NODUQ."}
        </p>
        <ModeSwitch value={mode} onChange={switchMode} options={MODES} />
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {mode === "account" ? (
            <>
              <Field id="email" label="Correo" error={error && !email.trim() ? error : undefined}>
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  error={Boolean(error && !email.trim())}
                />
              </Field>
              <Field id="password" label="Contraseña">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </Field>
            </>
          ) : (
            <>
              <Field id="username" label="Usuario" error={error && !username.trim() ? error : undefined}>
                <TextInput
                  id="username"
                  name="username"
                  autoComplete="username"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  error={Boolean(error && !username.trim())}
                />
              </Field>
              <Field id="code" label="Código">
                <PasswordInput
                  id="code"
                  name="code"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={submitting}
                  revealLabel="Mostrar código"
                  hideLabel="Ocultar código"
                />
              </Field>
            </>
          )}
          {error ? <Banner>{error}</Banner> : null}
          <Button type="submit" className="btn-block" loading={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
          {mode === "account" ? (
            <>
              <p className="auth-or">o</p>
              <button
                type="button"
                className="btn-google"
                onClick={() => void onGoogle()}
                disabled={submitting || googleLoading}
              >
                {googleLoading ? "Abriendo Google…" : "Continuar con Google"}
              </button>
            </>
          ) : null}
        </form>
        <p className="auth-switch">
          {mode === "employee" ? (
            <>
              ¿Entrar con la cuenta?{" "}
              <button type="button" onClick={() => switchMode("account")}>
                Entrar
              </button>
            </>
          ) : (
            <>
              ¿Aún no tienes cuenta? <Link href="/registro">Crear cuenta</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
