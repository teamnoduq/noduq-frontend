"use client";

import { motion, useReducedMotion } from "motion/react";

const C = {
  night: "#021113",
  ink: "#051c1f",
  lift: "#0b2a2e",
  well: "#010d0f",
  cian: "#88e7f3",
  navy: "#0f2595",
  mist: "#d3f6fb",
  ok: "#8ee0b8",
};

function Qr({ x, y, s = 64 }: { x: number; y: number; s?: number }) {
  const u = s / 11;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={s} height={s} rx={s * 0.1} fill={C.well} />
      {[
        [0, 0],
        [8, 0],
        [0, 8],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx * u} ${cy * u})`}>
          <rect width={u * 3} height={u * 3} fill="none" stroke={C.cian} strokeWidth="1.3" />
          <rect x={u * 0.95} y={u * 0.95} width={u * 1.1} height={u * 1.1} fill={C.cian} />
        </g>
      ))}
      {[
        [4, 4],
        [6, 5],
        [5, 7],
        [7, 4],
        [8, 6],
        [4, 9],
        [9, 8],
        [3, 5],
      ].map(([cx, cy], i) => (
        <rect key={i} x={cx * u} y={cy * u} width={u * 0.78} height={u * 0.78} fill={C.cian} opacity="0.9" />
      ))}
    </g>
  );
}

function Ground() {
  return <ellipse cx="240" cy="428" rx="148" ry="14" fill={C.cian} opacity="0.08" />;
}

export function SceneSms() {
  const reduce = useReducedMotion();
  const bubbles = [
    { x: 86, y: 128, w: 118, delay: 0 },
    { x: 58, y: 188, w: 96, delay: 0.7 },
    { x: 74, y: 248, w: 108, delay: 1.4 },
  ];

  return (
    <svg className="idea-art" viewBox="0 0 480 480" aria-hidden>
      <Ground />
      <rect x="198" y="78" width="164" height="308" rx="32" fill={C.ink} stroke={C.cian} strokeOpacity="0.28" />
      <rect x="212" y="102" width="136" height="248" rx="14" fill={C.well} />
      <rect x="258" y="88" width="44" height="6" rx="3" fill={C.mist} opacity="0.18" />
      <rect x="268" y="368" width="24" height="6" rx="3" fill={C.mist} opacity="0.2" />
      <Qr x="246" y="178" s="68" />
      {bubbles.map((b) => (
        <motion.g
          key={b.y}
          animate={
            reduce
              ? { opacity: 0.45, x: 0 }
              : { x: [0, 18], opacity: [0, 1, 1, 0] }
          }
          transition={{ duration: 2.8, delay: b.delay, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect x={b.x} y={b.y} width={b.w} height="44" rx="16" fill={C.lift} stroke={C.cian} strokeOpacity="0.35" />
          <circle cx={b.x + 18} cy={b.y + 22} r="5" fill={C.cian} />
          <rect x={b.x + 32} y={b.y + 14} width={b.w - 48} height="6" rx="3" fill={C.mist} opacity="0.35" />
          <rect x={b.x + 32} y={b.y + 26} width={b.w - 72} height="5" rx="2.5" fill={C.mist} opacity="0.18" />
        </motion.g>
      ))}
    </svg>
  );
}

export function SceneScan() {
  const reduce = useReducedMotion();

  return (
    <svg className="idea-art" viewBox="0 0 480 480" aria-hidden>
      <Ground />
      <rect x="86" y="292" width="308" height="22" rx="6" fill={C.lift} />
      <rect x="148" y="168" width="88" height="124" rx="10" fill={C.ink} stroke={C.cian} strokeOpacity="0.3" />
      <Qr x="160" y="186" s="64" />
      <rect x="168" y="292" width="48" height="18" rx="3" fill={C.ink} />
      <g transform="rotate(-18 318 250)">
        <rect x="262" y="142" width="112" height="216" rx="22" fill={C.ink} stroke={C.cian} strokeOpacity="0.32" />
        <rect x="274" y="158" width="88" height="168" rx="10" fill={C.well} />
        <rect x="304" y="148" width="28" height="5" rx="2.5" fill={C.mist} opacity="0.2" />
      </g>
      <motion.rect
        x="164"
        width="56"
        height="3"
        rx="1.5"
        fill={C.cian}
        animate={reduce ? { y: 216, opacity: 0.4 } : { y: [188, 246], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {[0, 0.9].map((delay) => (
        <motion.rect
          key={delay}
          x="132"
          y="152"
          width="120"
          height="156"
          rx="16"
          fill="none"
          stroke={C.cian}
          strokeWidth="1.5"
          animate={reduce ? { opacity: 0.15 } : { opacity: [0.45, 0], scale: [0.92, 1.18] }}
          style={{ transformOrigin: "192px 230px" }}
          transition={{ duration: 2.4, delay, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </svg>
  );
}

export function SceneTienda() {
  const reduce = useReducedMotion();

  return (
    <svg className="idea-art" viewBox="0 0 480 480" aria-hidden>
      <Ground />
      <path d="M96 214 L240 118 L384 214" fill={C.ink} stroke={C.cian} strokeOpacity="0.35" />
      <rect x="118" y="214" width="244" height="168" fill={C.lift} />
      <path d="M108 214 H372 L360 246 H120 Z" fill={C.navy} opacity="0.55" />
      <path d="M108 214 H372 L360 246 H120 Z" fill={C.cian} opacity="0.12" />
      <rect x="148" y="262" width="88" height="72" rx="6" fill={C.well} />
      <motion.rect
        x="156"
        y="270"
        width="72"
        height="56"
        rx="4"
        fill={C.cian}
        animate={reduce ? { opacity: 0.16 } : { opacity: [0.1, 0.28, 0.1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x="268" y="278" width="56" height="104" rx="6" fill={C.ink} stroke={C.cian} strokeOpacity="0.28" />
      <circle cx="312" cy="332" r="4" fill={C.cian} opacity="0.5" />
      <rect x="218" y="168" width="44" height="36" rx="4" fill={C.ink} stroke={C.cian} strokeOpacity="0.4" />
      <Qr x="224" y="174" s="32" />
      <ellipse cx="240" cy="390" rx="70" ry="8" fill={C.night} opacity="0.4" />
    </svg>
  );
}

export function SceneSello() {
  const reduce = useReducedMotion();

  return (
    <svg className="idea-art" viewBox="0 0 480 480" aria-hidden>
      <Ground />
      <g transform="rotate(-8 240 250)">
        <rect x="148" y="118" width="184" height="248" rx="10" fill={C.mist} opacity="0.08" />
        <rect x="148" y="118" width="184" height="248" rx="10" fill="none" stroke={C.cian} strokeOpacity="0.22" />
        <rect x="168" y="142" width="96" height="8" rx="4" fill={C.cian} opacity="0.35" />
        <rect x="168" y="166" width="144" height="6" rx="3" fill={C.mist} opacity="0.2" />
        <rect x="168" y="186" width="128" height="6" rx="3" fill={C.mist} opacity="0.14" />
        <rect x="168" y="206" width="136" height="6" rx="3" fill={C.mist} opacity="0.14" />
        <Qr x="186" y="232" s="72" />
      </g>
      <motion.g
        style={{ transformOrigin: "318px 188px" }}
        animate={
          reduce
            ? { scale: 1, opacity: 0.85 }
            : { scale: [0.55, 1.08, 1], opacity: [0, 1, 1, 1, 0] }
        }
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.18, 0.28, 0.78, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        <circle cx="318" cy="188" r="42" fill={C.ink} stroke={C.ok} strokeWidth="3" />
        <path
          d="M300 188 L312 200 L338 172"
          fill="none"
          stroke={C.ok}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );
}

export function SceneMostrador() {
  const reduce = useReducedMotion();

  return (
    <svg className="idea-art" viewBox="0 0 480 480" aria-hidden>
      <Ground />
      <rect x="92" y="78" width="6" height="86" fill={C.cian} opacity="0.2" />
      <path d="M78 164 H112 L118 176 H72 Z" fill={C.cian} opacity="0.16" />
      <rect x="72" y="292" width="336" height="28" rx="6" fill={C.lift} />
      <rect x="92" y="214" width="128" height="78" rx="10" fill={C.ink} stroke={C.cian} strokeOpacity="0.22" />
      <rect x="108" y="230" width="64" height="28" rx="4" fill={C.cian} opacity="0.14" />
      <rect x="108" y="266" width="44" height="8" rx="3" fill={C.mist} opacity="0.16" />
      <rect x="292" y="168" width="86" height="124" rx="16" fill={C.ink} stroke={C.cian} strokeOpacity="0.35" />
      <rect x="304" y="182" width="62" height="88" rx="8" fill={C.well} />
      <Qr x="313" y="196" s="44" />
      <motion.g
        animate={
          reduce
            ? { opacity: 0.7, y: 0 }
            : { y: [10, 0, 0, 10], opacity: [0, 1, 1, 0] }
        }
        transition={{ duration: 3.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect x="214" y="132" width="132" height="52" rx="16" fill={C.ink} stroke={C.cian} strokeOpacity="0.45" />
        <circle cx="234" cy="158" r="6" fill={C.ok} />
        <rect x="248" y="146" width="80" height="7" rx="3" fill={C.mist} opacity="0.4" />
        <rect x="248" y="162" width="58" height="6" rx="3" fill={C.mist} opacity="0.18" />
      </motion.g>
    </svg>
  );
}
