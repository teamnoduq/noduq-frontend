export function roleLabel(kind: "owner" | "employee" | null): string {
  return kind === "employee" ? "Empleado" : "Administrador";
}
