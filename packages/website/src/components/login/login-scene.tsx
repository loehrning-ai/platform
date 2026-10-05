"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const DotField = dynamic(
  () => import("@/components/login/dot-field").then((module) => module.DotField),
  { ssr: false },
);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PAUSE_STORAGE_KEY = "login-scene-paused";
export const LOGIN_SCENE_LAYER_ID = "login-scene-backdrop";

function readStoredPause(): boolean {
  try {
    return window.localStorage.getItem(PAUSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function storePause(paused: boolean): void {
  try {
    if (paused) window.localStorage.setItem(PAUSE_STORAGE_KEY, "1");
    else window.localStorage.removeItem(PAUSE_STORAGE_KEY);
  } catch {
    // Storage can be blocked; the toggle still works for this visit.
  }
}

/**
 * The /login backdrop: a fixed, viewport-sized layer under the page content
 * with the static 14px dot grid and the vignette, and, only when motion is
 * allowed, the lazily loaded dot field above them. The section that renders
 * this clips it (clip-path in login-scene.css), so the layer never paints
 * over the footer.
 *
 * The drift runs longer than five seconds, so a visible 44px pause toggle
 * (WCAG 2.2.2) exists whenever it moves: a fixed localized name, aria-pressed
 * for its state, and a choice remembered in this browser. Under
 * prefers-reduced-motion neither the canvas chunk nor the toggle is loaded.
 */
export function LoginScene({ pauseLabel }: { readonly pauseLabel: string }) {
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
    const sync = () => setMotionAllowed(!(query?.matches ?? false));
    sync();
    setPaused(readStoredPause());
    query?.addEventListener?.("change", sync);
    return () => query?.removeEventListener?.("change", sync);
  }, []);

  const toggle = useCallback(() => {
    // Storage is a side effect, so it stays out of the state updater (which
    // React may call twice in development).
    const next = !paused;
    storePause(next);
    setPaused(next);
  }, [paused]);

  return (
    <>
      <div
        id={LOGIN_SCENE_LAYER_ID}
        aria-hidden="true"
        data-login-scene-backdrop=""
        className="login-scene-backdrop"
      >
        {motionAllowed ? <DotField paused={paused} /> : null}
      </div>
      {motionAllowed ? (
        <button
          type="button"
          data-login-scene-toggle=""
          aria-label={pauseLabel}
          aria-pressed={paused}
          aria-controls={LOGIN_SCENE_LAYER_ID}
          onClick={toggle}
          className="login-scene-toggle"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            {paused ? (
              <path d="M5 3v10l8-5z" fill="currentColor" />
            ) : (
              <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
            )}
          </svg>
        </button>
      ) : null}
    </>
  );
}
