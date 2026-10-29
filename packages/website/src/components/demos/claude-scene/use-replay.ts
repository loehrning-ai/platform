"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSchedule, frameAt, type ReplayFrame, type ReplayTurn, type Schedule } from "./replay-engine";

export interface ReplayControl {
  readonly schedule: Schedule;
  readonly frame: ReplayFrame;
  readonly playing: boolean;
  readonly started: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  /** From the start (sending). */
  readonly replay: () => void;
  /** Jump to the finished state ("Antwort ganz zeigen"). */
  readonly finish: () => void;
}

/**
 * Drives the replay engine on a virtual clock with requestAnimationFrame. It
 * pauses while the scene is out of view or the tab is hidden, and shows the
 * finished state at once with reduced motion. A new set of turns (another
 * question, the skill switched, a follow-up added) keeps the time of the
 * turns that stay, so a follow-up continues under the first answer.
 */
export function useReplay(turns: readonly ReplayTurn[], options: { readonly seed: number; readonly reducedMotion: boolean; readonly visible: boolean; readonly producedNames: readonly string[]; readonly keepTime: boolean; readonly cps?: number }): ReplayControl {
  const producedKey = options.producedNames.join("|");
  const schedule = useMemo(
    () => buildSchedule(turns, { seed: options.seed, cps: options.cps, producedNames: producedKey ? producedKey.split("|") : [] }),
    [turns, options.seed, options.cps, producedKey],
  );
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const tRef = useRef(0);
  const frame = useRef(0);
  const last = useRef(0);

  const setTime = useCallback((value: number) => {
    tRef.current = value;
    setT(value);
  }, []);

  // A new schedule: a follow-up keeps the time (the first answer stays done); anything else rewinds.
  useEffect(() => {
    if (!options.keepTime) {
      setTime(0);
      setStarted(false);
      setPlaying(false);
    } else {
      setPlaying(true);
    }
    // keepTime is read at the moment the schedule changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, setTime]);

  useEffect(() => {
    if (!playing || !options.visible) return;
    if (options.reducedMotion) {
      setTime(schedule.duration);
      setPlaying(false);
      return;
    }
    last.current = 0;
    const tick = (now: number) => {
      const dt = last.current ? Math.min(100, now - last.current) : 16;
      last.current = now;
      const next = Math.min(schedule.duration, tRef.current + dt);
      setTime(next);
      if (next >= schedule.duration) {
        setPlaying(false);
        frame.current = 0;
        return;
      }
      frame.current = window.requestAnimationFrame(tick);
    };
    frame.current = window.requestAnimationFrame(tick);
    const onVisibility = () => {
      if (document.hidden && frame.current) {
        window.cancelAnimationFrame(frame.current);
        frame.current = 0;
      } else if (!document.hidden && !frame.current) {
        last.current = 0;
        frame.current = window.requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame.current) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [options.reducedMotion, options.visible, playing, schedule, setTime]);

  const play = useCallback(() => {
    setStarted(true);
    if (tRef.current >= schedule.duration) setTime(0);
    setPlaying(true);
  }, [schedule.duration, setTime]);
  const pause = useCallback(() => setPlaying(false), []);
  const replay = useCallback(() => {
    setStarted(true);
    setTime(0);
    setPlaying(true);
  }, [setTime]);
  const finish = useCallback(() => {
    setStarted(true);
    setPlaying(false);
    setTime(schedule.duration);
  }, [schedule.duration, setTime]);

  const current = useMemo(() => frameAt(schedule, started ? t : -1), [schedule, started, t]);
  return { schedule, frame: current, playing, started, play, pause, replay, finish };
}
