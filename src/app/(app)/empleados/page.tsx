"use client";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast";
import { Banner, Button, Dialog, Field, TextInput } from "@/components/ui";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  patchEmployee,
  regenerateEmployeeCode,
} from "@/lib/identity";
import { ApiError } from "@/lib/api";
import type { CreatedEmployee, Employee } from "@/lib/types";
import { Copy, Plus } from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useState } from "react";

const USERNAME_HINT = "Letras minúsculas, números o _ · 3 a 32. Si lo dejas vacío, lo generamos.";
const LOOKBACK = [
  { days: 1, label: "Hoy" },
  { days: 3, label: "3 días" },
  { days: 7, label: "7 días" },
];

function lookbackLabel(days: number): string {
  return LOOKBACK.find((item) => item.days === days)?.label ?? `${days} días`;
}

export default function EmpleadosPage() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [codeReveal, setCodeReveal] = useState<CreatedEmployee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [pendingRegen, setPendingRegen] = useState<Employee | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setEmployees(await listEmployees(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los empleados.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function showCreated(created: CreatedEmployee) {
    setEmployees((current) => {
      const next: Employee = {
        id: created.id,
        branchId: created.branchId,
        displayName: created.displayName,
        username: created.username,
        active: created.active,
        lookbackDays: created.lookbackDays ?? 1,
        createdAt: new Date().toISOString(),
      };
      const exists = current.some((item) => item.id === created.id);
      if (exists) {
        return current.map((item) => (item.id === created.id ? { ...item, ...next } : item));
      }
      return [next, ...current];
    });
    setCodeReveal(created);
  }

  async function onToggleActive(employee: Employee) {
    if (!accessToken) return;
    setBusyId(employee.id);
    try {
      const next = await patchEmployee(accessToken, employee.id, { active: !employee.active });
      setEmployees((list) => list.map((item) => (item.id === next.id ? next : item)));
      toast.show(next.active ? `${next.displayName} quedó activo.` : `${next.displayName} quedó inactivo.`, "ok");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "No se pudo actualizar.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    try {
      await deleteEmployee(accessToken, target.id);
      setEmployees((list) => list.filter((item) => item.id !== target.id));
      setPendingDelete(null);
      toast.show(`${target.displayName} se eliminó.`, "ok");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "No se pudo borrar.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function onConfirmRegen() {
    if (!accessToken || !pendingRegen) return;
    const target = pendingRegen;
    setBusyId(target.id);
    try {
      const created = await regenerateEmployeeCode(accessToken, target.id);
      setPendingRegen(null);
      showCreated(created);
      toast.show("Código nuevo. La sesión anterior ya no sirve.", "ok");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "No se pudo regenerar el código.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.show("Código copiado.", "ok");
    } catch {
      toast.show("No se pudo copiar. Selecciónalo a mano.", "error");
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <h1>Empleados</h1>
          <p className="lede">
            Cada uno entra con usuario y un código. El código solo se muestra una vez.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" />
          Nuevo empleado
        </Button>
      </header>

      {error ? (
        <Banner>
          {error}
          <div className="banner-actions">
            <Button type="button" variant="ghost" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        </Banner>
      ) : null}

      {loading ? (
        <div className="employee-list" aria-busy="true" aria-label="Cargando empleados">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : employees.length === 0 && !error ? (
        <div className="empty-box">
          Aún no hay empleados. Crea uno para dar usuario y código.
        </div>
      ) : (
        <ul className="employee-list">
          {employees.map((employee) => (
            <li key={employee.id} className="employee-row">
              <div>
                <div className="employee-name">{employee.displayName}</div>
                <div className="employee-user">
                  {employee.username} · ve {lookbackLabel(employee.lookbackDays)}
                </div>
              </div>
              <span className={employee.active ? "badge badge-on" : "badge badge-off"}>
                {employee.active ? "Activo" : "Inactivo"}
              </span>
              <div className="row-actions">
                <Button
                  type="button"
                  variant="quiet"
                  disabled={busyId === employee.id}
                  onClick={() => setEditing(employee)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  disabled={busyId === employee.id}
                  onClick={() => setPendingRegen(employee)}
                >
                  Nuevo código
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  loading={busyId === employee.id}
                  onClick={() => void onToggleActive(employee)}
                >
                  {employee.active ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busyId === employee.id}
                  onClick={() => setPendingDelete(employee)}
                >
                  Borrar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CreateEmployeeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        token={accessToken}
        onCreated={(created) => {
          setCreateOpen(false);
          showCreated(created);
        }}
      />

      <EditEmployeeDialog
        employee={editing}
        token={accessToken}
        onClose={() => setEditing(null)}
        onSaved={(next) => {
          setEmployees((list) => list.map((item) => (item.id === next.id ? next : item)));
          setEditing(null);
          toast.show("Datos guardados.", "ok");
        }}
      />

      <Dialog
        open={Boolean(codeReveal)}
        onClose={() => setCodeReveal(null)}
        title="Guarda este código ahora"
      >
        <p className="modal-copy">
          {codeReveal
            ? `${codeReveal.displayName} entra con el usuario ${codeReveal.username}. El código no vuelve a mostrarse.`
            : null}
        </p>
        <div className="code-block">{codeReveal?.code}</div>
        <div className="row-actions">
          <Button
            type="button"
            onClick={() => codeReveal && void copyCode(codeReveal.code)}
          >
            <Copy size={16} weight="bold" />
            Copiar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCodeReveal(null)}>
            Ya lo anoté
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pendingRegen)}
        onClose={() => setPendingRegen(null)}
        title="¿Regenerar el código?"
      >
        <p className="modal-copy">
          El código actual deja de servir y la sesión abierta se cierra. Tiene que entrar otra vez.
        </p>
        <div className="row-actions">
          <Button
            type="button"
            loading={Boolean(pendingRegen && busyId === pendingRegen.id)}
            onClick={() => void onConfirmRegen()}
          >
            Regenerar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPendingRegen(null)}>
            Cancelar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="¿Borrar a este empleado?"
        danger
      >
        <p className="modal-copy">
          {pendingDelete
            ? `Se elimina ${pendingDelete.displayName} (${pendingDelete.username}). No podrá entrar.`
            : null}
        </p>
        <div className="row-actions">
          <Button
            type="button"
            variant="danger"
            loading={Boolean(pendingDelete && busyId === pendingDelete.id)}
            onClick={() => void onConfirmDelete()}
          >
            Borrar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancelar
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function CreateEmployeeDialog({
  open,
  onClose,
  token,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  token: string | null;
  onCreated: (created: CreatedEmployee) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDisplayName("");
      setUsername("");
      setError(null);
      setNameError(null);
      setUserError(null);
    }
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNameError(null);
    setUserError(null);
    const name = displayName.trim();
    if (!name) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    const rawUser = username.trim();
    if (rawUser && !/^[a-zA-Z0-9_]{3,32}$/.test(rawUser)) {
      setUserError("El usuario debe tener entre 3 y 32 caracteres: letras, números o _.");
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      const created = await createEmployee(token, {
        displayName: name,
        username: rawUser || undefined,
      });
      onCreated(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el empleado.";
      if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
        setUserError(message);
      } else if (err instanceof ApiError && err.code === "USERNAME_INVALID") {
        setUserError(message);
      } else if (err instanceof ApiError && err.code === "DISPLAY_NAME_INVALID") {
        setNameError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo empleado">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Field id="new-name" label="Nombre" error={nameError ?? undefined}>
          <TextInput
            id="new-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            error={Boolean(nameError)}
          />
        </Field>
        <Field id="new-user" label="Usuario" optional hint={USERNAME_HINT} error={userError ?? undefined}>
          <TextInput
            id="new-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
            error={Boolean(userError)}
          />
        </Field>
        {error ? <Banner>{error}</Banner> : null}
        <div className="row-actions">
          <Button type="submit" loading={submitting}>
            Crear y ver código
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditEmployeeDialog({
  employee,
  token,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  token: string | null;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [lookbackDays, setLookbackDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setDisplayName(employee.displayName);
      setUsername(employee.username);
      setLookbackDays(employee.lookbackDays || 1);
      setError(null);
      setNameError(null);
      setUserError(null);
    }
  }, [employee]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employee || !token) return;
    setError(null);
    setNameError(null);
    setUserError(null);
    const name = displayName.trim();
    const rawUser = username.trim();
    if (!name) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(rawUser)) {
      setUserError("El usuario debe tener entre 3 y 32 caracteres: letras, números o _.");
      return;
    }
    setSubmitting(true);
    try {
      const next = await patchEmployee(token, employee.id, {
        displayName: name,
        username: rawUser,
        lookbackDays,
      });
      onSaved(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar.";
      if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
        setUserError(message);
      } else if (err instanceof ApiError && err.code === "USERNAME_INVALID") {
        setUserError(message);
      } else if (err instanceof ApiError && err.code === "DISPLAY_NAME_INVALID") {
        setNameError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(employee)} onClose={onClose} title="Editar empleado">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Field id="edit-name" label="Nombre" error={nameError ?? undefined}>
          <TextInput
            id="edit-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            error={Boolean(nameError)}
          />
        </Field>
        <Field id="edit-user" label="Usuario" hint={USERNAME_HINT} error={userError ?? undefined}>
          <TextInput
            id="edit-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
            error={Boolean(userError)}
          />
        </Field>
        <div className="field">
          <span className="field-label">Avisos que ve</span>
          <div className="chip-row" role="group" aria-label="Días de avisos">
            {LOOKBACK.map((option) => (
              <button
                key={option.days}
                type="button"
                className={lookbackDays === option.days ? "chip is-on" : "chip"}
                disabled={submitting}
                onClick={() => setLookbackDays(option.days)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <Banner>{error}</Banner> : null}
        <div className="row-actions">
          <Button type="submit" loading={submitting}>
            Guardar
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
