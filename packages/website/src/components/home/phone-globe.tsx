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
 *  - the opening (the signal from Berlin, about six seconds) starts once
 *    the page has loaded and gone idle; the live globe follows when it has
 *    played, or LIVE_GLOBE_DELAY_MS after that point when it does not play,
 *    then at idle: neither the opening's frames nor the projection chunk,
 *    its first frame and its frame loop compete with first paint, hydration
 *    or the load window. The live globe would only rest on Berlin under the
 *    opening anyway, so its tour clock counts from the opening's start
 *    (`clockStart`).
 *
 * The opening and the tour together last longer than five seconds, so WCAG
 * 2.2.2 needs a pause control: a real button, shown while the window moves
 * (from the opening on, before the live globe has arrived; for a remembered
 * pause from the same moment, pressed), whose choice
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

/**
 * The wait before the live globe when no opening plays (a remembered pause),
 * counted from the moment the opening would start: about the opening's
 * length (phone-hero.css plays hz-signal-stage for 5.6s after 0.2s).
 */
export const LIVE_GLOBE_DELAY_MS = 6000;

/** The opening's last animation; its end hands the stage to the live globe. */
const STAGE_ANIMATION = "hz-signal-stage";

/** Runs `callback` at the next idle period. Returns a cancel. */
function atIdle(callback: () => void): () => void {
  const win = window as IdleWindow;
  if (win.requestIdleCallback) {
    const handle = win.requestIdleCallback(callback, { timeout: 2500 });
    return () => win.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(callback, 200);
  return () => window.clearTimeout(handle);
}

/**
 * Runs `callback` once the page has loaded and the browser is idle, so it
 * never shares the main thread with hydration. Returns a cancel.
 */
function afterLoadAndIdle(callback: () => void): () => void {
  let cancelIdle: (() => void) | null = null;
  const onLoad = () => {
    cancelIdle = atIdle(callback);
  };
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
  return () => {
    window.removeEventListener("load", onLoad);
    cancelIdle?.();
  };
}

/**
 * Runs `callback` at idle once the opening on `slot` has ended, or
 * LIVE_GLOBE_DELAY_MS after the page settled (load and idle, when the
 * opening starts), whichever comes first. Returns a cancel.
 */
function afterOpening(slot: HTMLElement, callback: () => void): () => void {
  let delayHandle = 0;
  let cancelIdle: (() => void) | null = null;
  const release = () => {
    slot.removeEventListener("animationend", onStageEnd);
    window.clearTimeout(delayHandle);
  };
  const proceed = () => {
    if (cancelIdle) return;
    release();
    cancelIdle = atIdle(callback);
  };
  const onStageEnd = (event: AnimationEvent) => {
    if (event.animationName === STAGE_ANIMATION) proceed();
  };
  slot.addEventListener("animationend", onStageEnd);
  const cancelSettle = afterLoadAndIdle(() => {
    delayHandle = window.setTimeout(proceed, LIVE_GLOBE_DELAY_MS);
  });
  return () => {
    cancelSettle();
    release();
    cancelIdle?.();
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
  /** "static" while the window does not move (no opening, no live globe). */
  readonly state: PhoneGlobeState;
  readonly paused: boolean;
  readonly togglePaused: () => void;
  /** Hand to the live globe: its first frame hides the server frame. */
  readonly onLive: () => void;
  /**
   * Hand to the live globe: when the opening played, the performance.now()
   * it started, so the tour keeps the timing it would have had from there.
   */
  readonly clockStart: number | undefined;
};

export function usePhoneGlobe(): PhoneGlobe {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const [Network, setNetwork] = useState<ComponentType<
    Parameters<typeof HeroNetworkComponent>[0]
  > | null>(null);
  const [paused, setPaused] = useState(false);
  const [clockStart, setClockStart] = useState<number | undefined>();
  // True while this browser gets motion: from the opening (after load and
  // idle) on, then the live globe.
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || typeof window.matchMedia !== "function") return;

    pausedRef.current = readPaused();
    setPaused(pausedRef.current);

    let disposed = false;

    // The signal from Berlin (hero-signal-frame.tsx) plays once per page
    // view, for exactly the browsers that would get the moving globe and
    // have not paused it. Its resting state is invisible, so not playing it
    // leaves the static frame untouched. It starts once the page has loaded
    // and gone idle: its sixty frames a second of SVG paint would otherwise
    // share a phone's processor with hydration.
    let openingStart: number | undefined;
    // Set once the page has settled; from then on an eligible browser shows
    // the pause control, which arrives with the first motion.
    let settled = false;
    const cancelOpening = afterLoadAndIdle(() => {
      settled = true;
      if (disposed || !phoneGlobeEligible()) return;
      setMoving(true);
      if (pausedRef.current) return;
      slot.setAttribute(INTRO_ATTRIBUTE, "play");
      openingStart = performance.now();
    });
    const endIntro = (event: AnimationEvent) => {
      if (event.animationName === STAGE_ANIMATION) endSignal(slot);
    };
    slot.addEventListener("animationend", endIntro);

    let loading = false;
    // Only the first start waits for the opening; a later one (back from
    // desktop, motion allowed again) is long past the load window.
    let opened = false;
    let cancelWait: (() => void) | null = null;

    const stop = () => {
      endSignal(slot);
      cancelWait?.();
      cancelWait = null;
      loading = false;
      slot.removeAttribute("data-home-globe-live");
      setNetwork(null);
      setMoving(false);
    };

    const start = () => {
      if (settled) setMoving(true);
      if (loading) return;
      loading = true;
      const load = () => {
        cancelWait = null;
        opened = true;
        void import("@/components/home/hero-network")
          .then(({ HeroNetwork }) => {
            loading = false;
            if (disposed || !phoneGlobeEligible()) return;
            // A component in state is stored through the updater form.
            setNetwork(() => HeroNetwork);
            setClockStart(openingStart);
          })
          .catch(() => {
            // A failed chunk keeps the static frame; nothing else depends on it.
            loading = false;
          });
      };
      cancelWait = opened ? atIdle(load) : afterOpening(slot, load);
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
      cancelOpening();
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

  const state: PhoneGlobeState = moving
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
    clockStart,
  };
}

/** The phone globe's toggle; nothing while the window does not move. */
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
