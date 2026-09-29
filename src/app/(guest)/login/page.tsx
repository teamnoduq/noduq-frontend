"use client";

import { DeskQr } from "@/components/desk-qr";
import { Logo } from "@/components/brand";
import { Banner, Button, Field, ModeSwitch, PasswordInput, TextInput } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { AppleLogo, GooglePlayLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const METHODS = [
  { id: "credentials", label: "Credenciales" },
  { id: "qr", label: "Iniciar con QR" },
];

const WHO = [
  { id: "account", label: "Cuenta" },
  { id: "employee", label: "Empleado" },
];

export default function LoginPage() {
  const { signIn, signInEmployee, signInWithGoogle } = useAuth();
  const [method, setMethod] = useState("credentials");
  const [mode, setMode] = useState("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#empleado") {
      setMethod("credentials");
      setMode("employee");
    }
  }, []);

  function switchMethod(next: string) {
    setMethod(next);
    setError(null);
  }

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
    <div className="desk-login">
      <section className="desk-login-brand" aria-label="NODUQ">
        <div className="desk-lockup">
          <Logo size={36} />
          <span className="brand-word">NODUQ</span>
        </div>
        <div className="desk-brand-foot">
          <h2 className="desk-tagline">
            Gestiona tus pagos con QR y recibe la confirmación al instante.
          </h2>
          <p className="desk-app-note">Las cuentas nuevas se crean exclusivamente desde la app móvil.</p>
          <div className="store-row">
            <div className="store-badge" aria-label="Google Play, coming soon">
              <GooglePlayLogo size={22} weight="fill" aria-hidden="true" />
              <strong>Google Play</strong>
              <span className="store-soon" aria-hidden="true">Coming soon</span>
            </div>
            <div className="store-badge" aria-label="App Store, coming soon">
              <AppleLogo size={22} weight="fill" aria-hidden="true" />
              <strong>App Store</strong>
              <span className="store-soon" aria-hidden="true">Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      <section className="desk-login-panel">
        <div className="desk-login-card">
          <h1>Entrar</h1>
          {method === "credentials" ? (
            <p className="desk-login-lede">
              {mode === "employee" ? "Usa tus datos para continuar." : "Accede a tu cuenta NODUQ."}
            </p>
          ) : null}
          <div className="desk-methods">
            <ModeSwitch
              value={method}
              onChange={switchMethod}
              options={METHODS}
              ariaLabel="Método de entrada"
            />
          </div>

          {method === "qr" ? (
            <DeskQr />
          ) : (
            <>
              <div className="desk-who">
                <ModeSwitch value={mode} onChange={switchMode} options={WHO} />
              </div>
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
                    <p className="auth-forgot">
                      <Link href="/olvide">Olvidé mi contraseña</Link>
                    </p>
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
                      <GoogleMark />
                      {googleLoading ? "Abriendo Google…" : "Continuar con Google"}
                    </button>
                  </>
                ) : null}
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="google-mark" width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
