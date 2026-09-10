import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-stage">
      <div className="auth-card">
        <p className="auth-kicker">NODUQ</p>
        <h1>Esa página no existe</h1>
        <p className="auth-lede">Vuelve al panel o entra otra vez.</p>
        <p className="auth-switch">
          <Link href="/">Ir a pagos</Link>
        </p>
      </div>
    </div>
  );
}
