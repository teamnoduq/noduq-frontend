"use client";

import { useAuth } from "@/components/auth-provider";
import { MenuPopover } from "@/components/dropdown";
import { PlanInactive } from "@/components/plan-inactive";
import { useToast } from "@/components/toast";
import { useWorkspace } from "@/components/workspace-provider";
import { Banner, Button, Dialog, Field, TextInput } from "@/components/ui";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  patchEmployee,
  regenerateEmployeeCode,
} from "@/lib/identity";
import { ApiError } from "@/lib/api";
import { isPlanActive, type CreatedEmployee, type Employee } from "@/lib/types";
import { Copy, DotsThree, MagnifyingGlass, Plus, CaretLeft, CaretRight, UsersThree } from "@phosphor-icons/react";
import { FormEvent, useEffect, useState } from "react";

const USERNAME_HINT = "Letras minúsculas, números o _ · 3 a 32. Si lo dejas vacío, lo generamos.";
const LOOKBACK = [
  { days: 1, label: "Hoy" },
  { days: 3, label: "3 días" },
  { days: 7, label: "7 días" },
];
const PAGE_SIZES = [10, 25, 50, 100] as const;

function lookbackLabel(days: number): string {
  return LOOKBACK.find((item) => item.days === days)?.label ?? `${days} días`;
}

export default function EmpleadosPage() {
  const { accessToken } = useAuth();
  const { workspace } = useWorkspace();
  const planOn = isPlanActive(workspace);
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [count, setCount] = useState(0);
  const [roster, setRoster] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [codeReveal, setCodeReveal] = useState<CreatedEmployee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [pendingRegen, setPendingRegen] = useState<Employee | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setAppliedQuery(query), 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  const [seenQuery, setSeenQuery] = useState(appliedQuery);
  if (seenQuery !== appliedQuery) {
    setSeenQuery(appliedQuery);
    setPage(0);
  }

  useEffect(() => {
    if (!accessToken || !planOn) return;
    let cancel = false;
    const target = page;
    setPaging(true);
    setError(null);
    listEmployees(accessToken, {
      q: appliedQuery.trim() || undefined,
      limit: pageSize,
      offset: target * pageSize,
    })
      .then((feed) => {
        if (cancel) return;
        const nextCount = feed.count ?? feed.employees.length;
        const pages = Math.max(1, Math.ceil(nextCount / pageSize));
        if (target > pages - 1) {
          setPage(pages - 1);
          return;
        }
        setEmployees(feed.employees);
        setCount(nextCount);
        if (!appliedQuery.trim()) setRoster(nextCount);
      })
      .catch((err: unknown) => {
        if (!cancel) setError(err instanceof Error ? err.message : "No se pudieron cargar los empleados.");
      })
      .finally(() => {
        if (!cancel) {
          setLoading(false);
          setPaging(false);
        }
      });
    return () => {
      cancel = true;
    };
  }, [accessToken, appliedQuery, attempt, page, pageSize, planOn]);

  function showCreated(created: CreatedEmployee) {
    setPage(0);
    setAttempt((current) => current + 1);
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
      setPendingDelete(null);
      setAttempt((current) => current + 1);
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
        <div className="emp-title">
          <h1>Empleados</h1>
          {roster != null ? (
            <p className="emp-count">{roster === 1 ? "1 cuenta" : `${roster} cuentas`}</p>
          ) : null}
        </div>
      </header>

      {!planOn ? <PlanInactive /> : null}

      {planOn && error ? (
        <Banner>
          {error}
          <div className="banner-actions">
            <Button type="button" variant="ghost" onClick={() => setAttempt((current) => current + 1)}>
              Reintentar
            </Button>
          </div>
        </Banner>
      ) : null}

      {!planOn ? null : (
        <>
          <div className="pay-toolbar">
            <label className="search-box">
              <MagnifyingGlass size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o usuario..."
                aria-label="Buscar por nombre o usuario"
              />
            </label>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} weight="bold" />
              Nuevo empleado
            </Button>
          </div>
          <div className="pay-board emp-board">
            {loading || paging ? (
              <div className="pay-skel" aria-busy="true" aria-label="Cargando empleados">
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </div>
            ) : employees.length === 0 && !error ? (
              <div className="pay-empty">
                <span className="pay-empty-icon" aria-hidden="true">
                  <UsersThree size={28} weight="regular" />
                </span>
                <h2>{appliedQuery.trim() ? "Sin empleados con ese nombre" : "Aún no hay empleados"}</h2>
                <p>
                  {appliedQuery.trim()
                    ? "Ningún empleado coincide con esa búsqueda."
                    : "Crea uno para dar usuario y código."}
                </p>
              </div>
            ) : employees.length > 0 ? (
              <table className="pay-grid">
                <caption className="sr-only">
                  {count === 1 ? "1 empleado" : `${count} empleados`}
                </caption>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Historial</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong className="pay-who">{employee.displayName}</strong>
                      </td>
                      <td className="pay-user">{employee.username}</td>
                      <td className="pay-when">{lookbackLabel(employee.lookbackDays)}</td>
                      <td>
                        <span className={employee.active ? "status-badge" : "status-badge is-wait"}>
                          {employee.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="pay-created">{createdLabel(employee.createdAt)}</td>
                      <td>
                        <div className="emp-actions">
                          <button
                            type="button"
                            className="emp-edit"
                            disabled={busyId === employee.id}
                            onClick={() => setEditing(employee)}
                          >
                            Editar
                          </button>
                          <MenuPopover
                            ariaLabel={`Más acciones de ${employee.displayName}`}
                            portal
                            trigger={<DotsThree size={18} weight="bold" aria-hidden="true" />}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              disabled={busyId === employee.id}
                              onClick={() => setPendingRegen(employee)}
                            >
                              Nuevo código
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={busyId === employee.id}
                              onClick={() => void onToggleActive(employee)}
                            >
                              {employee.active ? "Desactivar" : "Activar"}
                            </button>
                            <div className="menu-rule" role="separator" />
                            <button
                              type="button"
                              role="menuitem"
                              className="is-danger"
                              disabled={busyId === employee.id}
                              onClick={() => setPendingDelete(employee)}
                            >
                              Borrar
                            </button>
                          </MenuPopover>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {count > 0 ? (
              <nav className="pay-pager" aria-label="Páginas de empleados">
                <button type="button" disabled={page === 0 || paging} onClick={() => setPage((current) => current - 1)}>
                  <CaretLeft size={14} weight="bold" aria-hidden="true" />
                  Anterior
                </button>
                <div className="pay-pager-pages">
                  {pageWindow(page, Math.max(1, Math.ceil(count / pageSize))).map((item, index) =>
                    item === "gap" ? (
                      <span key={`gap-${index}`} className="pay-pager-gap" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        aria-current={item === page ? "page" : undefined}
                        disabled={paging}
                        onClick={() => setPage(item)}
                      >
                        {item + 1}
                      </button>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  disabled={page >= Math.ceil(count / pageSize) - 1 || paging}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Siguiente
                  <CaretRight size={14} weight="bold" aria-hidden="true" />
                </button>
                <label className="pay-pager-size">
                  <span>Por página</span>
                  <select
                    aria-label="Empleados por página"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
                      setPage(0);
                    }}
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </nav>
            ) : null}
          </div>
        </>
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
        onSaved={() => {
          setEditing(null);
          setAttempt((current) => current + 1);
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

function createdLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${day} · ${time}`;
}

function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const wanted = [0, total - 1, current - 1, current, current + 1].filter(
    (value, index, all) => value >= 0 && value < total && all.indexOf(value) === index,
  );
  wanted.sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  wanted.forEach((value, index) => {
    if (index > 0 && value - wanted[index - 1] > 1) out.push("gap");
    out.push(value);
  });
  return out;
}
