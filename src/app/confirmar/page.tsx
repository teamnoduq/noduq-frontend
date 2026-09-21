"use client";

import { Brand } from "@/components/brand";
import { Banner } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";
import { authTypeFromLocation, noduqAppAuthHref, openNoduqApp } from "@/lib/noduq-app-link";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ConfirmPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [status, setStatus] = useState<"wait" | "ok" | "dead">("wait");
  const [appHref, setAppHref] = useState<string | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (authTypeFromLocation() === "recovery") {
      window.location.replace(`/recuperar${window.location.search}${window.location.hash}`);
      return;
    }

    let alive = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive || !session) return;
      const href = noduqAppAuthHref({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        type: "signup",
        email: session.user.email,
      });
      setAppHref(href);
      setStatus("ok");
      if (!opened.current) {
        opened.current = true;
        openNoduqApp(href);
      }
    });

    void supabase.auth.getSession().then(({ data: next }) => {
      if (!alive) return;
      if (next.session) return;
      window.setTimeout(() => {
        if (!alive) return;
        setStatus((current) => (current === "ok" ? current : "dead"));
      }, 2500);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        {status === "wait" ? (
          <>
            <h1>Confirmando…</h1>
            <p className="auth-lede">Un segundo. Si tienes la app, te la abrimos.</p>
          </>
        ) : null}
        {status === "ok" ? (
          <>
            <h1>Cuenta confirmada</h1>
            <p className="auth-lede">Sigue en NODUQ, en el teléfono. Ahí está el onboarding del comercio.</p>
            {appHref ? (
              <p>
                <a className="btn btn-primary btn-block" href={appHref}>
                  Abrir la app
                </a>
              </p>
            ) : null}
            <p className="auth-switch">
              ¿Sin el teléfono a mano? <Link href="/setup">Seguir en el panel</Link>
            </p>
          </>
        ) : null}
        {status === "dead" ? (
          <>
            <h1>El enlace no sirvió</h1>
            <Banner>Expiró o ya se usó. Pide otro desde la app o el registro.</Banner>
            <p className="auth-switch">
              <Link href="/login">Volver a entrar</Link>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
