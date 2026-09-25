"use client";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast";
import { Button, Dialog, Field, TextInput } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { gmailConnect, gmailDisconnect, gmailStatus, type GmailStatus } from "@/lib/gmail";
import { deleteMe, patchMe, patchOrganization, cancelPlan, reactivatePlan } from "@/lib/identity";
import { isPlanCancelling, isPlanRenewing } from "@/lib/types";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CuentaPage() {
  const { kind } = useAuth();
  if (kind === "employee") return <EmployeeAccount />;
  return <OwnerAccount />;
}

function EmployeeAccount() {
  const { employeeSession, signOut } = useAuth();
  const employee = employeeSession?.employee;
  const org = employeeSession?.organization.name;

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Cuenta</h1>
          <p className="lede">Tu usuario en {org ?? "NODUQ"}.</p>
        </div>
      </header>

      <section className="section">
        <h2>Tú</h2>
        <div className="stack">
          <Field id="employee-name" label="Nombre">
            <TextInput id="employee-name" value={employee?.displayName ?? ""} readOnly disabled />
          </Field>
          <Field id="employee-user" label="Usuario">
            <TextInput id="employee-user" value={employee?.username ?? ""} readOnly disabled />
          </Field>
        </div>
      </section>

      <section className="section">
        <h2>Sesión</h2>
        <p className="lede">Sales de este navegador. Puedes volver a entrar con usuario y código.</p>
        <div className="row-actions">
          <Button type="button" variant="ghost" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </section>
    </section>
  );
}

function formatPeriodEnd(iso: string | null): string {
  if (!iso) return "el final del periodo";
  const formatted = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
  return formatted;
}

function OwnerAccount() {
  const toast = useToast();
  const router = useRouter();
  const { accessToken, user, signOut } = useAuth();
  const { workspace, applyWorkspace } = useWorkspace();
  const [displayName, setDisplayName] = useState(workspace?.profile.displayName ?? "");
  const [orgName, setOrgName] = useState(workspace?.organization.name ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [gmail, setGmail] = useState<GmailStatus | null>(null);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    void gmailStatus(accessToken)
      .then((status) => {
        if (alive) setGmail(status);
      })
      .catch(() => {
        if (alive) setGmail(null);
      });
    if (new URLSearchParams(window.location.search).get("gmail") === "ok") {
      toast.show("Gmail quedó conectado.", "ok");
      window.history.replaceState({}, "", "/cuenta");
    }
    return () => {
      alive = false;
    };
  }, [accessToken, toast]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const name = displayName.trim();
    if (!name) {
      setProfileError("El nombre es obligatorio.");
      return;
    }
    setProfileError(null);
    setSavingProfile(true);
    try {
      const profile = await patchMe(accessToken, { displayName: name });
      if (workspace) {
        applyWorkspace({ ...workspace, profile: { ...workspace.profile, displayName: profile.displayName } });
      }
      setDisplayName(profile.displayName);
      toast.show("Nombre actualizado.", "ok");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSaveOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    const name = orgName.trim();
    if (name.length < 2 || name.length > 80) {
      setOrgError("El nombre debe tener entre 2 y 80 caracteres.");
      return;
    }
    setOrgError(null);
    setSavingOrg(true);
    try {
      const next = await patchOrganization(accessToken, { name });
      applyWorkspace(next);
      setOrgName(next.organization.name);
      toast.show("Organización actualizada.", "ok");
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSavingOrg(false);
    }
  }

  async function onDeleteAccount() {
    if (!accessToken) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteMe(accessToken);
      toast.show("La cuenta se borró.", "ok");
      await signOut();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo borrar la cuenta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Cuenta</h1>
          <p className="lede">Tu nombre, la organización y el cierre de la cuenta.</p>
        </div>
      </header>

      <section className="section">
        <h2>Tu perfil</h2>
        <p className="lede">Así te ven en este panel. El correo no se cambia aquí.</p>
        <form className="stack" onSubmit={onSaveProfile} noValidate>
          <Field id="email-readonly" label="Correo">
            <TextInput id="email-readonly" value={user?.email ?? ""} readOnly disabled />
          </Field>
          <Field id="displayName" label="Tu nombre" error={profileError ?? undefined}>
            <TextInput
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={savingProfile}
              error={Boolean(profileError)}
            />
          </Field>
          <div className="row-actions">
            <Button type="submit" loading={savingProfile}>
              Guardar nombre
            </Button>
          </div>
        </form>
      </section>

      <section className="section">
        <h2>Organización</h2>
        <p className="lede">Este nombre hay que escribirlo para borrar la cuenta.</p>
        <form className="stack" onSubmit={onSaveOrg} noValidate>
          <Field id="orgName" label="Nombre" error={orgError ?? undefined}>
            <TextInput
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={savingOrg}
              error={Boolean(orgError)}
            />
          </Field>
          <div className="row-actions">
            <Button type="submit" loading={savingOrg}>
              Guardar
            </Button>
          </div>
        </form>
      </section>

      {isPlanCancelling(workspace) ? (
        <section className="section">
          <h2>Suscripción cancelada</h2>
          <p className="lede">
            Tu suscripción finaliza el {formatPeriodEnd(workspace?.plan.periodEndsAt ?? null)}. Hasta
            esa fecha la validación automática seguirá funcionando.
          </p>
          <div className="row-actions">
            <Button
              type="button"
              loading={planBusy}
              onClick={async () => {
                if (!accessToken) return;
                setPlanBusy(true);
                try {
                  const plan = await reactivatePlan(accessToken);
                  if (workspace) applyWorkspace({ ...workspace, plan });
                  toast.show("El plan quedó activo otra vez.", "ok");
                } catch (err) {
                  toast.show(err instanceof Error ? err.message : "No se pudo reactivar.", "error");
                } finally {
                  setPlanBusy(false);
                }
              }}
            >
              Reactivar plan
            </Button>
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>{isPlanRenewing(workspace) ? "Plan" : "Plan Pro NODUQ"}</h2>
          {isPlanRenewing(workspace) ? (
            <>
              <p className="lede">Activo. NODUQ valida y avisa los pagos.</p>
              <p className="lede">$24.900 / mes · cancela cuando quieras.</p>
              <button type="button" className="plan-cancel" onClick={() => setCancelOpen(true)}>
                Cancelar suscripción
              </button>
            </>
          ) : (
            <>
              <ul className="plan-benefits">
                <li>Validaciones automáticas e ilimitadas por SMS y Correo</li>
                <li>Notificaciones instantáneas para tu equipo en el mostrador</li>
              </ul>
              <div className="row-actions">
                <Button type="button" onClick={() => router.push("/plan")}>
                  Activar plan · $24.900/mes
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="section">
        <h2>Gmail</h2>
        <p className="lede">
          El SMS confirma el pago en el mostrador. Gmail es el mismo aviso, más tarde: si cuadra,
          el pago queda verificado con correo.
        </p>
        <div className="stack">
          {gmail == null ? (
            <p className="lede">Cargando Gmail…</p>
          ) : gmail.connected ? (
            <>
              <p>{gmail.address ?? "Gmail conectado"}</p>
              <div className="row-actions">
                <Button
                  type="button"
                  variant="ghost"
                  loading={gmailBusy}
                  onClick={async () => {
                    if (!accessToken) return;
                    setGmailBusy(true);
                    try {
                      await gmailDisconnect(accessToken);
                      setGmail({ ...gmail, connected: false, address: null });
                      toast.show("Gmail se desconectó.", "ok");
                    } catch (err) {
                      toast.show(err instanceof Error ? err.message : "No se pudo soltar Gmail.", "error");
                    } finally {
                      setGmailBusy(false);
                    }
                  }}
                >
                  Soltar Gmail
                </Button>
              </div>
            </>
          ) : !gmail.configured ? (
            <p className="lede">
              El servidor todavía no tiene el cliente de Gmail. Cuando esté, el botón aparece aquí.
            </p>
          ) : (
            <div className="row-actions">
              <Button
                type="button"
                loading={gmailBusy}
                onClick={async () => {
                  if (!accessToken) return;
                  setGmailBusy(true);
                  try {
                    const connect = await gmailConnect(accessToken);
                    window.location.assign(connect.authorizationUrl);
                  } catch (err) {
                    toast.show(err instanceof Error ? err.message : "No se pudo abrir Gmail.", "error");
                    setGmailBusy(false);
                  }
                }}
              >
                Conectar Gmail
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Sesión y cuenta</h2>
        <div className="stack">
          <Button type="button" variant="ghost" className="btn-block" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
          <button
            type="button"
            className="btn-delete-account"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            Eliminar cuenta
          </button>
        </div>
      </section>

      <Dialog
        className="modal-plan"
        open={cancelOpen}
        onClose={() => {
          if (!planBusy) setCancelOpen(false);
        }}
        title="¿Deseas cancelar tu suscripción?"
      >
        <p className="modal-copy">
          Tus empleados dejarán de recibir la confirmación de pagos en el mostrador al finalizar el
          periodo actual.
        </p>
        <div className="row-actions">
          <Button type="button" onClick={() => setCancelOpen(false)}>
            Mantener mi plan
          </Button>
          <button
            type="button"
            className="btn-plain-danger"
            disabled={planBusy}
            onClick={async () => {
              if (!accessToken) return;
              setPlanBusy(true);
              try {
                const plan = await cancelPlan(accessToken);
                if (workspace) applyWorkspace({ ...workspace, plan });
                setCancelOpen(false);
              } catch (err) {
                toast.show(err instanceof Error ? err.message : "No se pudo cancelar.", "error");
              } finally {
                setPlanBusy(false);
              }
            }}
          >
            Sí, cancelar plan
          </button>
        </div>
      </Dialog>

      <Dialog
        className="modal-plan"
        open={deleteOpen}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteConfirm("");
          setDeleteError(null);
        }}
        title="¿Eliminar cuenta de NODUQ?"
      >
        <p className="modal-copy">
          Esta acción es permanente e irreversible. Perderás la configuración de tu local, tu
          historial y la conexión con tus empleados. Si el plan se cobra en Play, la renovación se
          cancela al borrar la cuenta.
        </p>
        <p className="modal-confirm-label">
          Para confirmar, escribe el nombre de tu negocio (
          {workspace?.organization.name ?? "tu negocio"}):
        </p>
        <input
          className="modal-confirm-input"
          value={deleteConfirm}
          onChange={(event) => setDeleteConfirm(event.target.value)}
          placeholder="Nombre del negocio"
          autoComplete="off"
          disabled={deleting}
        />
        {deleteError ? <p className="field-error">{deleteError}</p> : null}
        <div className="stack">
          <Button
            type="button"
            variant="danger"
            className="btn-block"
            loading={deleting}
            disabled={
              deleting ||
              !workspace?.organization.name ||
              deleteConfirm !== workspace.organization.name
            }
            onClick={() => void onDeleteAccount()}
          >
            Eliminar mi cuenta definitivamente
          </Button>
          <Button
            type="button"
            variant="quiet"
            className="btn-block"
            disabled={deleting}
            onClick={() => {
              setDeleteOpen(false);
              setDeleteConfirm("");
              setDeleteError(null);
            }}
          >
            Cancelar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
