import { api } from "@/lib/api";
import type {
  CreatedEmployee,
  Employee,
  EmployeeSessionPayload,
  Organization,
  Profile,
  Workspace,
} from "@/lib/types";

export function getMe(token: string) {
  return api<Workspace>("/v1/me", token);
}

export function bootstrapMe(
  token: string,
  body: { displayName?: string; organizationName: string },
) {
  return api<Workspace>("/v1/me/bootstrap", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchMe(token: string, body: { displayName: string }) {
  return api<Profile>("/v1/me", token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteMe(token: string, confirmation: string) {
  return api<void>("/v1/me", token, {
    method: "DELETE",
    body: JSON.stringify({ confirmation }),
  });
}

export function getOrganization(token: string) {
  return api<Organization>("/v1/organization", token);
}

export function patchOrganization(token: string, body: { name: string }) {
  return api<Workspace>("/v1/organization", token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listEmployees(token: string) {
  return api<Employee[]>("/v1/employees", token);
}

export function createEmployee(
  token: string,
  body: { displayName: string; username?: string; branchId?: string },
) {
  return api<CreatedEmployee>("/v1/employees", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchEmployee(
  token: string,
  id: string,
  body: { displayName?: string; username?: string; active?: boolean },
) {
  return api<Employee>(`/v1/employees/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function regenerateEmployeeCode(token: string, id: string) {
  return api<CreatedEmployee>(`/v1/employees/${id}/code`, token, {
    method: "POST",
  });
}

export function deleteEmployee(token: string, id: string) {
  return api<void>(`/v1/employees/${id}`, token, {
    method: "DELETE",
  });
}

export function createEmployeeSession(body: { username: string; code: string }) {
  return api<EmployeeSessionPayload>("/v1/employee/sessions", null, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getEmployeeMe(token: string) {
  return api<EmployeeSessionPayload>("/v1/employee/me", token);
}

export function deleteEmployeeSession(token: string) {
  return api<void>("/v1/employee/sessions/me", token, {
    method: "DELETE",
  });
}

export function workspaceFromEmployee(payload: EmployeeSessionPayload): Workspace {
  return {
    profile: {
      id: payload.employee.id,
      displayName: payload.employee.displayName,
    },
    organization: payload.organization,
    role: "employee",
    branches: [payload.branch],
  };
}
