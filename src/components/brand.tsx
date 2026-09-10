import Image from "next/image";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/logo-nq-cian-noche.png"
      alt=""
      width={size}
      height={size}
      priority
      className="brand-mark"
    />
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <Logo size={compact ? 28 : 40} />
      <span className="brand-word">NODUQ</span>
    </span>
  );
}
