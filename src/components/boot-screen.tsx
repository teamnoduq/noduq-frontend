export function BootScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="boot" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
