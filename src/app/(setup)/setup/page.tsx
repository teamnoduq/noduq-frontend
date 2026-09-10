"use client";

import { Brand } from "@/components/brand";
import { useAuth } from "@/components/auth-provider";
import { Banner, Button, Field, TextInput } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { bootstrapMe } from "@/lib/identity";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const { applyWorkspace } = useWorkspace();
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    const name = organizationName.trim();
    if (name.length < 2 || name.length > 80) {
      setFieldError("El nombre debe tener entre 2 y 80 caracteres.");
      return;
    }
    if (!accessToken) {
      setError("La sesión se cerró. Vuelve a entrar.");
      return;
    }
    setSubmitting(true);
    try {
      const workspace = await bootstrapMe(accessToken, {
        organizationName: name,
        displayName: displayName.trim() || undefined,
      });
      applyWorkspace(workspace);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la organización.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Brand />
        <h1>Tu organización</h1>
        <p className="auth-lede">Así aparece en NODUQ. Después puedes crear empleados.</p>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <Field id="organization" label="Organización" error={fieldError ?? undefined}>
            <TextInput
              id="organization"
              name="organization"
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              disabled={submitting}
              error={Boolean(fieldError)}
              describedBy={fieldError ? "organization-error" : undefined}
            />
          </Field>
          <Field id="displayName" label="Tu nombre" optional>
            <TextInput
              id="displayName"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.email ?? ""}
              disabled={submitting}
            />
          </Field>
          {error ? <Banner>{error}</Banner> : null}
          <Button type="submit" className="btn-block" loading={submitting}>
            {submitting ? "Guardando…" : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
