"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { beatIndexFromParam, clockT, splitClock, TAKEHOME_TARGET_ID, type Beat } from "@/lib/demo-beats";
import { resolveDemoKey } from "@/lib/demo-keys";
import type { Locale } from "@/lib/i18n/locale";

/** The visible rewind of "Von vorn" / Shift+R, in milliseconds. */
export const REWIND_MS = 400;
/** The share of the stage that must be in view before the intro plays. */
export const INTRO_THRESHOLD = 0.6;

export type BeatCause = "load" | "user";

export interface BeatClock {
  readonly beats: readonly Beat[];
  readonly locale: Locale;
  /** The clock: beat index plus progress, in [0, beats.length]. */
  readonly t: number;
  readonly index: number;
  readonly beat: Beat;
  /** Progress of the current beat's motion, 0 to 1. */
  readonly progress: number;
  /** True while "Von vorn" rewinds the clock. */
  readonly rewinding: boolean;
  readonly reducedMotion: boolean;
  /** Projector mode from ?room=1: stage only, larger type. */
  readonly room: boolean;
  /** The current beat's motion has finished and, for a commit beat, the visitor has committed. */
  readonly canAdvance: boolean;
  /** A commit beat before the current one was skipped: show the kit default as "Vorschlag übernommen". */
  readonly skippedCommit: boolean;
  /** Marks the current commit beat as done (the visitor placed their bet). */
  readonly commit: () => void;
  /** Jumps to a beat (rail marks never wait for a commit). */
  readonly seek: (index: number, cause?: BeatCause) => void;
  readonly next: () => void;
  readonly prev: () => void;
  /** Back to beat 1 with a visible rewind; own data stays, bets reset through onRestart. */
  readonly restart: () => void;
  /** The stage registers itself so the intro waits until it is in view. */
  readonly registerStage: (element: HTMLElement | null) => void;
  /** Called after every restart: reset bets, predictions and motion, never own data. */
  readonly onRestart: (listener: () => void) => () => void;
  /** Called on Escape: close an open detail card. */
  readonly onEscape: (listener: () => void) => () => void;
  /** Lets the current beat hold "Weiter" and ArrowRight, or take a press for an inner step (useBeatGate). */
  readonly setGate: (gate: BeatGate | null) => void;
}

/**
 * A beat with inner steps (several sentences, an action that must run first)
 * gates the clock: while `ready` is false "Weiter" stays hidden and
 * ArrowRight does nothing; once ready, `onNext` may take the press for an
 * inner step by returning true. Rail marks and r never wait for a gate.
 */
export interface BeatGate {
  readonly ready: boolean;
  readonly onNext?: () => boolean;
}

const BeatClockContext = createContext<BeatClock | null>(null);

export function useBeatClock(): BeatClock {
  const clock = useContext(BeatClockContext);
  if (!clock) throw new Error("useBeatClock needs a <BeatClockProvider> (the v3 demo shell)");
  return clock;
}

/** Subscribes a listener to restart for the lifetime of the component. */
export function useOnRestart(listener: () => void): void {
  const { onRestart } = useBeatClock();
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => onRestart(() => latest.current()), [onRestart]);
}

/**
 * Gates the current beat (see BeatGate). Pass null on beats without inner
 * steps. The latest onNext is always the one called.
 */
export function useBeatGate(ready: boolean | null, onNext?: () => boolean): void {
  const { setGate } = useBeatClock();
  const latest = useRef(onNext);
  useEffect(() => {
    latest.current = onNext;
  });
  useEffect(() => {
    if (ready === null) {
      setGate(null);
      return;
    }
    setGate({ ready, onNext: () => latest.current?.() ?? false });
    return () => setGate(null);
  }, [ready, setGate]);
}

/** Subscribes a listener to Escape for the lifetime of the component. */
export function useOnEscape(listener: () => void): void {
  const { onEscape } = useBeatClock();
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => onEscape(() => latest.current()), [onEscape]);
}

/**
 * Scrolls an element into view only when it is off screen. For handlers of the
 * visitor's own taps and keys only: the page never scrolls itself on load.
 */
export function revealIfOffscreen(element: Element | null, reducedMotion: boolean): void {
  if (!element) return;
  const box = element.getBoundingClientRect();
  const height = window.innerHeight || document.documentElement.clientHeight;
  if (box.top >= 0 && box.top < height * 0.8) return;
  element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduce;
}

type Listener = () => void;

function useListeners() {
  const set = useRef(new Set<Listener>());
  const add = useCallback((listener: Listener) => {
    set.current.add(listener);
    return () => {
      set.current.delete(listener);
    };
  }, []);
  const fire = useCallback(() => {
    for (const listener of [...set.current]) listener();
  }, []);
  return { add, fire, size: () => set.current.size };
}

interface ClockState {
  readonly index: number;
  readonly progress: number;
  readonly rewinding: boolean;
}

/**
 * The one clock of a v3 demo page. It owns the beat, the motion progress
 * (requestAnimationFrame, a pure function of elapsed time), the keys
 * (src/lib/demo-keys.ts), the ?beat= and ?room=1 deep links (read once on
 * load) and the restart. Nothing loops: each beat's motion runs once when it
 * is entered; the first beat's intro waits until the stage is 60 % in view.
 * With reduced motion every beat shows its end frame at once.
 */
export function BeatClockProvider({
  beats,
  locale,
  children,
}: {
  readonly beats: readonly Beat[];
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<ClockState>({ index: 0, progress: 0, rewinding: false });
  const [committed, setCommitted] = useState<ReadonlySet<number>>(() => new Set());
  const [room, setRoom] = useState(false);
  const [stageSeen, setStageSeen] = useState(false);
  const frame = useRef(0);
  const stageRef = useRef<HTMLElement | null>(null);
  const gateRef = useRef<BeatGate | null>(null);
  const [gateReady, setGateReady] = useState(true);
  const setGate = useCallback((gate: BeatGate | null) => {
    gateRef.current = gate;
    setGateReady(gate ? gate.ready : true);
  }, []);
  const restartListeners = useListeners();
  const escapeListeners = useListeners();
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  const stop = useCallback(() => {
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);

  /** Runs the motion of beat `index` from progress 0 to 1. */
  const play = useCallback(
    (index: number) => {
      stop();
      const seconds = beats[index]?.seconds ?? 0;
      if (reducedMotion || seconds <= 0) {
        setState({ index, progress: 1, rewinding: false });
        return;
      }
      setState({ index, progress: 0, rewinding: false });
      let start = -1;
      const tick = (now: number) => {
        if (start < 0) start = now;
        const progress = Math.min(1, (now - start) / (seconds * 1000));
        setState({ index, progress, rewinding: false });
        frame.current = progress < 1 ? window.requestAnimationFrame(tick) : 0;
      };
      frame.current = window.requestAnimationFrame(tick);
    },
    [beats, reducedMotion, stop],
  );

  const enter = useCallback(
    (index: number, cause: BeatCause) => {
      const clamped = Math.max(0, Math.min(beats.length - 1, index));
      play(clamped);
      if (cause === "user" && beats[clamped]?.kind === "takehome") {
        revealIfOffscreen(document.getElementById(TAKEHOME_TARGET_ID), reducedMotion);
      }
    },
    [beats, play, reducedMotion],
  );

  const current = beats[state.index] as Beat;
  const canAdvance =
    !state.rewinding &&
    gateReady &&
    state.progress >= 1 &&
    state.index < beats.length - 1 &&
    (current.kind !== "commit" || committed.has(state.index));

  const next = useCallback(() => {
    const { index, progress, rewinding } = stateRef.current;
    if (rewinding || index >= beats.length - 1) return;
    const beat = beats[index] as Beat;
    if (progress < 1) {
      // A press during the motion finishes it first, then the next press moves on.
      stop();
      setState({ index, progress: 1, rewinding: false });
      return;
    }
    if (beat.kind === "commit" && !committed.has(index)) return;
    const gate = gateRef.current;
    if (gate && (!gate.ready || gate.onNext?.())) return;
    enter(index + 1, "user");
  }, [beats, committed, enter, stop]);

  const prev = useCallback(() => {
    const { index, rewinding } = stateRef.current;
    if (rewinding || index === 0) return;
    stop();
    setState({ index: index - 1, progress: 1, rewinding: false });
  }, [stop]);

  const seek = useCallback(
    (index: number, cause: BeatCause = "user") => {
      if (stateRef.current.rewinding) return;
      enter(index, cause);
    },
    [enter],
  );

  const restart = useCallback(() => {
    stop();
    setCommitted(new Set());
    const from = clockT(stateRef.current.index, stateRef.current.progress);
    const finish = () => {
      restartListeners.fire();
      play(0);
    };
    if (reducedMotion || from <= 0) {
      finish();
      return;
    }
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const share = Math.min(1, (now - start) / REWIND_MS);
      const { index, progress } = splitClock(from * (1 - share), beats.length);
      setState({ index, progress, rewinding: share < 1 });
      if (share < 1) frame.current = window.requestAnimationFrame(tick);
      else {
        frame.current = 0;
        finish();
      }
    };
    frame.current = window.requestAnimationFrame(tick);
  }, [beats.length, play, reducedMotion, restartListeners, stop]);

  const commit = useCallback(() => {
    const { index } = stateRef.current;
    setCommitted((previous) => (previous.has(index) ? previous : new Set([...previous, index])));
  }, []);

  // Deep links, read once on load: ?beat=<id|n> and ?room=1. Never written back.
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("room") === "1") setRoom(true);
    const index = beatIndexFromParam(beats, params.get("beat"));
    if (index !== null && index > 0) {
      setStageSeen(true);
      enter(index, "load");
    }
  }, [beats, enter]);

  // The first beat's intro plays once, when the stage is 60 % in view.
  useEffect(() => {
    if (stageSeen) return;
    const element = stageRef.current;
    if (reducedMotion || !element || typeof IntersectionObserver === "undefined") {
      setStageSeen(true);
      if (stateRef.current.index === 0 && stateRef.current.progress === 0) play(0);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.intersectionRatio >= INTRO_THRESHOLD)) return;
        observer.disconnect();
        setStageSeen(true);
        if (stateRef.current.index === 0 && stateRef.current.progress === 0) play(0);
      },
      { threshold: [INTRO_THRESHOLD] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [play, reducedMotion, stageSeen]);

  // Reduced motion switched on mid-beat: jump to the end frame.
  useEffect(() => {
    if (!reducedMotion) return;
    stop();
    setState((previous) => (previous.progress >= 1 ? previous : { ...previous, progress: 1, rewinding: false }));
  }, [reducedMotion, stop]);

  // Keys: ArrowRight, ArrowLeft, r / Shift+R, Escape (src/lib/demo-keys.ts).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = resolveDemoKey(event);
      if (!action) return;
      if (action === "escape") {
        if (escapeListeners.size() === 0) return;
        escapeListeners.fire();
        return;
      }
      event.preventDefault();
      if (action === "next") next();
      else if (action === "prev") prev();
      else restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escapeListeners, next, prev, restart]);

  // Projector mode follows the deck: { type: "demo-beat", beat } from the same origin.
  useEffect(() => {
    if (!room) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; beat?: unknown } | null;
      if (!data || data.type !== "demo-beat") return;
      const index = beatIndexFromParam(beats, typeof data.beat === "number" ? String(data.beat) : String(data.beat ?? ""));
      if (index !== null) enter(index, "load");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [beats, enter, room]);

  useEffect(() => stop, [stop]);

  const registerStage = useCallback((element: HTMLElement | null) => {
    stageRef.current = element;
  }, []);

  const skippedCommit = beats.some(
    (beat, index) => beat.kind === "commit" && index < state.index && !committed.has(index),
  );

  const value = useMemo<BeatClock>(
    () => ({
      beats,
      locale,
      t: clockT(state.index, state.progress),
      index: state.index,
      beat: beats[state.index] as Beat,
      progress: state.progress,
      rewinding: state.rewinding,
      reducedMotion,
      room,
      canAdvance,
      skippedCommit,
      commit,
      seek,
      next,
      prev,
      restart,
      registerStage,
      onRestart: restartListeners.add,
      onEscape: escapeListeners.add,
      setGate,
    }),
    [beats, canAdvance, commit, escapeListeners.add, locale, next, prev, reducedMotion, registerStage, restart, restartListeners.add, room, seek, setGate, skippedCommit, state],
  );

  return (
    <BeatClockContext.Provider value={value}>
      <div data-demo-clock="" data-beat={value.beat.id} data-beat-kind={value.beat.kind} data-room={room ? "" : undefined}>
        {children}
      </div>
    </BeatClockContext.Provider>
  );
}
