"use client";

import { useEffect, useRef, useState } from "react";
import { createSpring, type SpringHandle } from "@/components/demos/glas";

/**
 * Morphs between two values of any shape (a pebble layout, a bar height) with
 * the smooth spring whenever `key` changes; the spring is critically damped,
 * so a number never passes its target. Reduced motion jumps. Idle: no frame.
 */
export function useMorph<T>(target: T, key: string, lerp: (a: T, b: T, t: number) => T, reducedMotion: boolean): T {
  const [shown, setShown] = useState(target);
  const [doneKey, setDoneKey] = useState(key);
  const live = useRef({ value: target, target, lerp, key });
  const spring = useRef<SpringHandle | null>(null);

  useEffect(() => {
    live.current.target = target;
    live.current.lerp = lerp;
  });

  useEffect(() => {
    const current = live.current;
    if (current.key === key) return;
    current.key = key;
    const from = current.value;
    const to = current.target;
    spring.current?.stop();
    if (reducedMotion) {
      current.value = to;
      setShown(to);
      setDoneKey(key);
      return;
    }
    spring.current = createSpring(
      0,
      "smooth",
      (t) => {
        const value = current.lerp(from, to, Math.min(1, Math.max(0, t)));
        current.value = value;
        setShown(value);
      },
      () => setDoneKey(key),
    );
    spring.current.to(1);
  }, [key, reducedMotion]);

  useEffect(() => {
    if (doneKey === key) live.current.value = target;
  }, [doneKey, key, target]);

  useEffect(() => () => spring.current?.stop(), []);

  return doneKey === key ? target : shown;
}

export const lerpNumber = (a: number, b: number, t: number) => a + (b - a) * t;
