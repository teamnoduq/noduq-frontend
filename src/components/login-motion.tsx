"use client";

import { SceneMostrador, SceneScan, SceneSello, SceneSms, SceneTienda } from "@/components/login-ideas";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ComponentType } from "react";
import { useSearchParams } from "next/navigation";

export const LOGIN_IDEAS = [
  { id: "base", label: "Base" },
  { id: "sms", label: "SMS" },
  { id: "scan", label: "Escaneo" },
  { id: "tienda", label: "Tienda" },
  { id: "sello", label: "Sello" },
  { id: "mostrador", label: "Mostrador" },
] as const;

export type LoginIdeaId = (typeof LOGIN_IDEAS)[number]["id"];

const SCENES: Record<Exclude<LoginIdeaId, "base">, ComponentType> = {
  sms: SceneSms,
  scan: SceneScan,
  tienda: SceneTienda,
  sello: SceneSello,
  mostrador: SceneMostrador,
};

function isIdea(value: string | null): value is LoginIdeaId {
  return LOGIN_IDEAS.some((idea) => idea.id === value);
}

export function useLoginIdea(): LoginIdeaId {
  const params = useSearchParams();
  const raw = params.get("idea");
  if (raw === "particulas") return "sms";
  if (raw === "anillo") return "scan";
  if (raw === "orbita") return "tienda";
  return isIdea(raw) ? raw : "base";
}

export function LoginIdeaNav({ idea }: { idea: LoginIdeaId }) {
  return (
    <nav className="idea-switch" aria-label="Vistas del login">
      {LOGIN_IDEAS.map((item) => (
        <Link
          key={item.id}
          href={item.id === "base" ? "/login" : `/login?idea=${item.id}`}
          className={item.id === idea ? "is-on" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function LoginMotion({ idea }: { idea: Exclude<LoginIdeaId, "base"> }) {
  const Scene = SCENES[idea];

  return (
    <aside className="auth-motion">
      <div className="auth-motion-stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={idea}
            className="auth-motion-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <Scene />
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
