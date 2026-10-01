"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

const inherited = {
  color: "inherit",
  fontSize: "inherit",
  fontWeight: "inherit",
  letterSpacing: "inherit",
} as const;

/** Same beat as the phone: the number eases to the new value while the text fades back in. */
export function CountingValue({
  value,
  format,
}: {
  value: number;
  format: (value: number) => string;
}) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(value);
  const [text, setText] = useState(() => format(value));
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const paint = (next: number) => setText(format(next));
    if (reduce) {
      motionValue.set(value);
      paint(value);
      setOpacity(1);
      return;
    }
    const from = motionValue.get();
    setOpacity(0.55);
    const fade = animate(0.55, 1, {
      duration: 0.15,
      ease: EASE,
      onUpdate: setOpacity,
    });
    const count = animate(from, value, {
      duration: 0.42,
      ease: EASE,
      onUpdate: (next) => {
        motionValue.set(next);
        paint(next);
      },
    });
    return () => {
      fade.stop();
      count.stop();
    };
    // format is read from the render that started this change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return <span style={{ ...inherited, opacity }}>{text}</span>;
}
