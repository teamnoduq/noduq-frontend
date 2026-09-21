import { Banner } from "@/components/ui";
import { ReactNode, useState } from "react";

export function MailSentView({
  icon,
  title,
  children,
  tip,
  primary,
  primaryHref,
  secondary,
  onSecondary,
}: {
  icon: "mail" | "key";
  title: string;
  children: ReactNode;
  tip?: string;
  primary: string;
  primaryHref: string;
  secondary: string;
  onSecondary: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await onSecondary();
      setNote("Te lo volvimos a enviar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mail-sent">
      <div className="mail-sent-disc" aria-hidden="true">
          {icon === "key" ? (
            <svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M160,16A80.07,80.07,0,0,0,83.91,120.78L26.34,178.34A8,8,0,0,0,24,184v40a8,8,0,0,0,8,8H72a8,8,0,0,0,8-8V208H96a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l9.56-9.57A80,80,0,1,0,160,16Zm0,144a64,64,0,1,1,64-64A64.07,64.07,0,0,1,160,160Zm16-80a16,16,0,1,1,16,16A16,16,0,0,1,176,80Z" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19Z" />
            </svg>
          )}
        </div>
      <h1>{title}</h1>
      <p className="auth-lede">{children}</p>
      {tip ? <p className="mail-sent-tip">{tip}</p> : null}
      {error ? <Banner>{error}</Banner> : null}
      {note ? <Banner>{note}</Banner> : null}
      <a className="btn btn-primary btn-block" href={primaryHref}>
        {primary}
      </a>
      <p className="auth-switch">
        <button type="button" onClick={() => void resend()} disabled={busy}>
          {busy ? "Enviando…" : secondary}
        </button>
      </p>
    </div>
  );
}
