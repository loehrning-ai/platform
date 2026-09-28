"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlobeToggle } from "@/components/home/globe-toggle";
import type {
  HorizonMotionState,
  HorizonRenderer,
} from "@/components/werk/horizon-globe-renderer";

/**
 * Loader and pause control for the phone hero's live globe.
 *
 * The server frame (werk/horizon-globe-frame.tsx) is the globe at first
 * paint and for everyone who does not get motion. This hook only decides
 * whether and when to add motion on top of it:
 *
 *  - below lg only (the desktop hero keeps its own globe and never downloads
 *    this renderer), re-evaluated when the viewport crosses the breakpoint;
 *  - never under prefers-reduced-motion, prefers-reduced-data or Save-Data:
 *    those visitors keep the static frame, get no pause control and download
 *    nothing;
 *  - after the load event plus an idle callback, and after the frame's CSS
 *    opening has finished, so the renderer never competes with first paint,
 *    hydration or the opening.
 *
 * The drift lasts longer than five seconds, so WCAG 2.2.2 needs a pause
 * control: a real button, shown only while the renderer is live, whose
 * choice is remembered in this browser.
 */

/**
 * Tailwind `lg`, as a media query. The phone band (phone-hero.css), this
 * renderer's eligibility and the desktop globe in hero.tsx all switch on it,
 * so exactly one globe runs at any width and any default font size.
 */
export const LG_QUERY = "(min-width: 64rem)";
const DESKTOP_QUERY = LG_QUERY;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const REDUCED_DATA_QUERY = "(prefers-reduced-data: reduce)";
const PAUSED_KEY = "loehrning:home-globe-paused";

type NetworkInformationLike = { readonly saveData?: boolean };

function readPaused(): boolean {
  try {
    return window.localStorage.getItem(PAUSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writePaused(paused: boolean): void {
  try {
    if (paused) window.localStorage.setItem(PAUSED_KEY, "1");
    else window.localStorage.removeItem(PAUSED_KEY);
  } catch {
    // Storage blocked (private mode, policy): the choice lasts for this page.
  }
}

function matches(query: string): boolean {
  return window.matchMedia?.(query).matches ?? false;
}

/** True when this browser should get the live globe right now. */
export function phoneGlobeEligible(): boolean {
  if (typeof window === "undefined") return false;
  const connection = (navigator as Navigator & {
    connection?: NetworkInformationLike;
  }).connection;
  return (
    !matches(DESKTOP_QUERY) &&
    !matches(REDUCED_MOTION_QUERY) &&
    !matches(REDUCED_DATA_QUERY) &&
    connection?.saveData !== true
  );
}

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/** Runs `callback` after the load event and an idle period. Returns a cancel. */
function afterLoadAndIdle(callback: () => void): () => void {
  const win = window as IdleWindow;
  let idleHandle = 0;
  let timeoutHandle = 0;
  const schedule = () => {
    if (win.requestIdleCallback) {
      idleHandle = win.requestIdleCallback(callback, { timeout: 2500 });
    } else {
      timeoutHandle = window.setTimeout(callback, 200);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idleHandle) win.cancelIdleCallback?.(idleHandle);
    if (timeoutHandle) window.clearTimeout(timeoutHandle);
  };
}

/** Resolves when every CSS animation inside `root` (the opening) has ended. */
async function openingFinished(root: HTMLElement): Promise<void> {
  if (typeof root.getAnimations !== "function") return;
  const animations = root.getAnimations({ subtree: true });
  await Promise.all(
    animations.map((animation) => animation.finished.catch(() => undefined)),
  );
}

export type PhoneGlobe = {
  readonly slotRef: React.RefObject<HTMLDivElement | null>;
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The fixed layer (parallels, limb, scale), stacked above `canvasRef`. */
  readonly staticCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The renderer's motion state; "static" while the server frame shows. */
  readonly state: HorizonMotionState;
  readonly paused: boolean;
  readonly togglePaused: () => void;
};

export function usePhoneGlobe(): PhoneGlobe {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<HorizonRenderer | null>(null);
  const pausedRef = useRef(false);
  const [state, setState] = useState<HorizonMotionState>("static");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    const canvas = canvasRef.current;
    if (!slot || !canvas || typeof window.matchMedia !== "function") return;

    pausedRef.current = readPaused();
    setPaused(pausedRef.current);

    let disposed = false;
    let loading = false;
    let cancelWait: (() => void) | null = null;

    // A visitor who scrolls straight away never sees the opening's story
    // beats; snap the frame to its resting state (the reduced-motion frame)
    // so the takeover does not wait on animations playing off screen.
    const finishOpening = () => {
      if (typeof slot.getAnimations !== "function") return;
      for (const animation of slot.getAnimations({ subtree: true })) {
        try {
          animation.finish();
        } catch {
          // An infinite or detached animation cannot finish; none exist here.
        }
      }
    };
    window.addEventListener("scroll", finishOpening, {
      once: true,
      passive: true,
    });

    const stop = () => {
      cancelWait?.();
      cancelWait = null;
      loading = false;
      rendererRef.current?.destroy();
      rendererRef.current = null;
      setState("static");
    };

    const start = () => {
      if (rendererRef.current || loading) return;
      loading = true;
      cancelWait = afterLoadAndIdle(() => {
        cancelWait = null;
        void openingFinished(slot)
          .then(() => import("@/components/werk/horizon-globe-renderer"))
          .then(({ createHorizonRenderer }) => {
            loading = false;
            if (disposed || rendererRef.current || !phoneGlobeEligible()) return;
            rendererRef.current = createHorizonRenderer({
              slot,
              canvas,
              staticCanvas: staticCanvasRef.current,
              paused: pausedRef.current,
              onState: (next) => {
                if (!disposed) setState(next);
              },
            });
          })
          .catch(() => {
            // A failed chunk keeps the static frame; nothing else depends on it.
            loading = false;
          });
      });
    };

    const sync = () => {
      if (phoneGlobeEligible()) start();
      else stop();
    };

    const queries = [DESKTOP_QUERY, REDUCED_MOTION_QUERY, REDUCED_DATA_QUERY].map(
      (query) => window.matchMedia(query),
    );
    for (const query of queries) query.addEventListener?.("change", sync);
    sync();

    return () => {
      disposed = true;
      window.removeEventListener("scroll", finishOpening);
      for (const query of queries) query.removeEventListener?.("change", sync);
      stop();
    };
  }, []);

  const togglePaused = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    writePaused(next);
    rendererRef.current?.setPaused(next);
  }, []);

  return { slotRef, canvasRef, staticCanvasRef, state, paused, togglePaused };
}

/** The phone horizon globe's toggle; nothing while the static frame shows. */
export function PhoneGlobeToggle({
  globe,
  label,
}: {
  readonly globe: PhoneGlobe;
  readonly label: string;
}) {
  if (globe.state === "static") return null;
  return (
    <GlobeToggle
      variant="phone"
      paused={globe.paused}
      label={label}
      onToggle={globe.togglePaused}
    />
  );
}
