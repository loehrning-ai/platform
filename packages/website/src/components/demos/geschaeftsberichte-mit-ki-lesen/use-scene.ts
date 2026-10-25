"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { END_SCENE, HERO_SCENE, INTRO_SECONDS, easeInOut, easeOut, introScene, lerp, type Scene } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/motion";

type Tweened = "cutF" | "m" | "u" | "s";

interface Tween {
  readonly from: number;
  readonly to: number;
  readonly ms: number;
  start: number | null;
}

const EASE: Readonly<Record<Tweened, (t: number) => number>> = { cutF: easeOut, m: easeInOut, u: easeInOut, s: easeInOut };

export interface SceneControl {
  readonly scene: Scene;
  /** Tween one progress variable to a target (instant under reduced motion). */
  readonly to: (key: Tweened, value: number, ms?: number) => void;
  /** Set progress variables at once (a drag), cancelling their tweens. */
  readonly set: (patch: Partial<Pick<Scene, Tweened>>) => void;
  /**
   * Hand control to the visitor (call on any input): a running pass jumps to the settled state, and the nine columns
   * gather into the two towers (at once under reduced motion). Cheap to call again.
   */
  readonly skipIntro: () => void;
  /** Start the one-shot first-run pass; returns false under reduced motion. */
  readonly startIntro: () => boolean;
  readonly reduced: () => boolean;
  /** The scene as of this instant (not as of the last render), for handlers that run between frames. */
  readonly read: () => Scene;
}

/**
 * The one rAF driver. Every visual reads the scene it writes; there are no
 * CSS transitions on geometry and no other clock. Reduced motion jumps to
 * the target (duration 0) and never plays the intro.
 */
export function useScene(): SceneControl {
  const [scene, setScene] = useState<Scene>(HERO_SCENE);
  const current = useRef<Scene>(HERO_SCENE);
  const frameId = useRef(0);
  const tweens = useRef(new Map<Tweened, Tween>());
  const intro = useRef<{ start: number | null } | null>(null);
  const reducedRef = useRef(false);
  const locked = useRef(false);

  const commit = useCallback((next: Scene) => {
    current.current = next;
    setScene(next);
  }, []);

  const frame = useCallback(
    (ts: number) => {
      frameId.current = 0;
      let next = current.current;
      let active = false;
      if (intro.current) {
        intro.current.start ??= ts;
        const seconds = (ts - intro.current.start) / 1000;
        next = introScene(seconds);
        if (seconds >= INTRO_SECONDS) intro.current = null;
        else active = true;
      } else {
        for (const [key, tween] of tweens.current) {
          tween.start ??= ts;
          const t = tween.ms <= 0 ? 1 : Math.min(1, (ts - tween.start) / tween.ms);
          next = { ...next, [key]: lerp(tween.from, tween.to, EASE[key](t)) };
          if (t >= 1) tweens.current.delete(key);
          else active = true;
        }
      }
      commit(next);
      if (active) frameId.current = requestAnimationFrame(frame);
    },
    [commit],
  );

  const kick = useCallback(() => {
    if (frameId.current === 0) frameId.current = requestAnimationFrame(frame);
  }, [frame]);

  const to = useCallback(
    (key: Tweened, value: number, ms = 360) => {
      locked.current = true;
      if (reducedRef.current || ms <= 0) {
        tweens.current.delete(key);
        commit({ ...current.current, [key]: value });
        return;
      }
      tweens.current.set(key, { from: current.current[key], to: value, ms, start: null });
      kick();
    },
    [commit, kick],
  );

  const set = useCallback(
    (patch: Partial<Pick<Scene, Tweened>>) => {
      locked.current = true;
      for (const key of Object.keys(patch) as Tweened[]) tweens.current.delete(key);
      commit({ ...current.current, ...patch });
    },
    [commit],
  );

  const skipIntro = useCallback(() => {
    locked.current = true;
    if (intro.current) {
      intro.current = null;
      commit({ ...END_SCENE, s: current.current.s });
    }
    if (current.current.s < 1 && !tweens.current.has("s")) to("s", 1, 480);
  }, [commit, to]);

  const startIntro = useCallback(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current || locked.current) return false;
    intro.current = { start: null };
    commit(introScene(0));
    kick();
    return true;
  }, [commit, kick]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedRef.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(
    () => () => {
      if (frameId.current !== 0) cancelAnimationFrame(frameId.current);
    },
    [],
  );

  const reduced = useCallback(() => reducedRef.current, []);
  const read = useCallback(() => current.current, []);
  return { scene, to, set, skipIntro, startIntro, reduced, read };
}
