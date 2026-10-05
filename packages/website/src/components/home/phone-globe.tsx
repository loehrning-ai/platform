"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { GlobeToggle } from "@/components/home/globe-toggle";
import type { HeroNetwork as HeroNetworkComponent } from "@/components/home/hero-network";

/**
 * Loader and pause control for the phone hero's live globe.
 *
 * The server frame (hero-globe-frame.tsx) is the globe at first paint and
 * for everyone who does not get motion. This hook only decides whether and
 * when to add motion on top of it:
 *
 *  - below lg only (the desktop hero mounts its own globe on the same
 *    query), re-evaluated when the viewport crosses the breakpoint;
 *  - never under prefers-reduced-motion, prefers-reduced-data or Save-Data:
 *    those visitors keep the static frame, get no pause control and download
 *    nothing;
 *  - after the load event plus an idle callback, so the projection chunk
 *    never competes with first paint or hydration.
 *
 * The tour lasts longer than five seconds, so WCAG 2.2.2 needs a pause
 * control: a real button, shown only while the globe is live, whose choice
 * is remembered in this browser.
 */

/**
 * Tailwind `lg`, as a media query. The phone band (phone-hero.css), this
 * loader's eligibility and the desktop globe in hero.tsx all switch on it,
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
  const connection = (
    navigator as Navigator & {
      connection?: NetworkInformationLike;
    }
  ).connection;
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

/** Set on the globe window while the one-time signal from Berlin plays. */
export const INTRO_ATTRIBUTE = "data-home-intro";

/** Ends the opening: the layer rests invisible (phone-hero.css). */
function endSignal(slot: HTMLElement): void {
  if (slot.getAttribute(INTRO_ATTRIBUTE) === "play") {
    slot.setAttribute(INTRO_ATTRIBUTE, "done");
  }
}

export type PhoneGlobeState = "static" | "running" | "paused";

export type PhoneGlobe = {
  readonly slotRef: React.RefObject<HTMLDivElement | null>;
  /** The live globe, once its chunk has arrived for an eligible browser. */
  readonly Network: typeof HeroNetworkComponent | null;
  /** "static" while the server frame shows. */
  readonly state: PhoneGlobeState;
  readonly paused: boolean;
  readonly togglePaused: () => void;
  /** Hand to the live globe: its first frame hides the server frame. */
  readonly onLive: () => void;
};

export function usePhoneGlobe(): PhoneGlobe {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const [Network, setNetwork] = useState<ComponentType<
    Parameters<typeof HeroNetworkComponent>[0]
  > | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || typeof window.matchMedia !== "function") return;

    pausedRef.current = readPaused();
    setPaused(pausedRef.current);

    // The signal from Berlin (hero-signal-frame.tsx) plays once per page
    // view, for exactly the browsers that would get the moving globe and
    // have not paused it. Its resting state is invisible, so not playing it
    // leaves the static frame untouched.
    if (phoneGlobeEligible() && !pausedRef.current) {
      slot.setAttribute(INTRO_ATTRIBUTE, "play");
    }
    const endIntro = (event: AnimationEvent) => {
      if (event.animationName === "hz-signal-stage") endSignal(slot);
    };
    slot.addEventListener("animationend", endIntro);

    let disposed = false;
    let loading = false;
    let cancelWait: (() => void) | null = null;

    const stop = () => {
      endSignal(slot);
      cancelWait?.();
      cancelWait = null;
      loading = false;
      slot.removeAttribute("data-home-globe-live");
      setNetwork(null);
    };

    const start = () => {
      if (loading) return;
      loading = true;
      cancelWait = afterLoadAndIdle(() => {
        cancelWait = null;
        void import("@/components/home/hero-network")
          .then(({ HeroNetwork }) => {
            loading = false;
            if (disposed || !phoneGlobeEligible()) return;
            // A component in state is stored through the updater form.
            setNetwork(() => HeroNetwork);
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

    const queries = [
      DESKTOP_QUERY,
      REDUCED_MOTION_QUERY,
      REDUCED_DATA_QUERY,
    ].map((query) => window.matchMedia(query));
    for (const query of queries) query.addEventListener?.("change", sync);
    sync();

    return () => {
      disposed = true;
      for (const query of queries) query.removeEventListener?.("change", sync);
      slot.removeEventListener("animationend", endIntro);
      cancelWait?.();
    };
  }, []);

  const togglePaused = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    writePaused(next);
    // Pausing also settles the opening at once.
    if (next && slotRef.current) endSignal(slotRef.current);
  }, []);

  const onLive = useCallback(() => {
    slotRef.current?.setAttribute("data-home-globe-live", "");
  }, []);

  const state: PhoneGlobeState = Network
    ? paused
      ? "paused"
      : "running"
    : "static";

  return {
    slotRef,
    Network: Network as typeof HeroNetworkComponent | null,
    state,
    paused,
    togglePaused,
    onLive,
  };
}

/** The phone globe's toggle; nothing while the static frame shows. */
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
      controls="home-phone-globe"
      onToggle={globe.togglePaused}
    />
  );
}
