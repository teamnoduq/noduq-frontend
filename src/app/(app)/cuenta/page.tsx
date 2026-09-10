"use client";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast";
import { Button, Dialog, Field, TextInput } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { deleteMe, patchMe, patchOrganization } from "@/lib/identity";
import { FormEvent, useState } from "react";

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

function OwnerAccount() {
  const toast = useToast();
  const { accessToken, user, signOut } = useAuth();
  const { workspace, applyWorkspace } = useWorkspace();
  const [displayName, setDisplayName] = useState(workspace?.profile.displayName ?? "");
  const [orgName, setOrgName] = useState(workspace?.organization.name ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function onDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setDeleteError(null);
    if (!confirmation.trim()) {
      setDeleteError("Escribe el nombre de la organización para confirmar.");
      return;
    }
    setDeleting(true);
    try {
      await deleteMe(accessToken, confirmation);
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

      <section className="section">
        <h2>Sesión</h2>
        <p className="lede">Sales de este navegador. Las sesiones de empleados no se cierran.</p>
        <div className="stack">
          <div className="row-actions">
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Borrar cuenta</h2>
        <p className="lede">
          Se borra la organización, los empleados y el acceso. Para confirmar, escribe el nombre
          exacto de la organización.
        </p>
        <div className="stack">
          <div className="row-actions">
            <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              Borrar cuenta
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmation("");
          setDeleteError(null);
        }}
        title="Borrar la cuenta"
        danger
      >
        <p className="modal-copy">
          Escribe <strong>{workspace?.organization.name}</strong> para continuar. Esto no se puede
          deshacer.
        </p>
        <form className="stack" onSubmit={onDeleteAccount} noValidate>
          <Field id="confirm-org" label="Organización" error={deleteError ?? undefined}>
            <TextInput
              id="confirm-org"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              disabled={deleting}
              error={Boolean(deleteError)}
            />
          </Field>
          <div className="row-actions">
            <Button type="submit" variant="danger" loading={deleting}>
              Borrar para siempre
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmation("");
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
