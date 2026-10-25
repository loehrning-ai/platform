"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { SpecimenChapter } from "@/lib/open-source/artifacts";
import {
  chapterIndexAt,
  chapterLengths,
  formatSeconds,
  rewindMs,
  rulerKeyTarget,
  smoothstep,
  valueText,
} from "@/lib/open-source/specimen-clock";
import { getSpecimenConductor } from "./specimen-conductor";
import { driverSlot } from "./stage-driver";
import "./specimen.css";

/** The plate's words, resolved on the server so no copy table ships. */
export interface PlateCopy {
  readonly play: string;
  readonly pause: string;
  readonly again: string;
  readonly hint: string;
  readonly ruler: string;
  readonly chapters: string;
}

/** The drawn specimen's toy: where it holds and what it says. */
export interface PlateToy {
  readonly atS: number;
  readonly on: string;
  readonly back: string;
  readonly saidOn: string;
  readonly saidBack: string;
}

type Mode = "rest" | "paused" | "rewind" | "play" | "tween";
type Ui = "fresh" | "running" | "paused" | "done";

const RUNNING: readonly Mode[] = ["rewind", "play", "tween"];
const ROW_REM = 2.75;
/**
 * Autoplay shows the finished frame this long before the tape rewinds: long
 * enough to read as the result, short enough that motion starts within 1 s.
 */
const AUTOPLAY_HOLD_MS = 300;

/**
 * Where the parts of a plate sit. `stack`: one column, the stage right under
 * the head. From lg on the whole column is capped so stage and ruler fit a
 * 900 px high screen, and centred in the plate, so head, stage, chapters and
 * colophon all end on one vertical. Below sm the stage and ruler bleed to the
 * plate border (the plate's p-3), so the film is the hero of a phone screen.
 * `detail`: stage left, chapters right, no head or foot.
 */
export type PlateLayout = "stack" | "detail";

const PLACE: Record<
  PlateLayout,
  { grid: string; surface: string; frame: string; stage: string; chapters: string; foot: string }
> = {
  stack: {
    grid: "grid gap-3 sm:gap-5 lg:mx-auto lg:w-full lg:max-w-[max(22rem,calc(100svh-25rem))]",
    surface: "max-sm:-mx-3",
    frame: "border-y sm:border-x",
    stage: "",
    chapters: "",
    foot: "",
  },
  detail: {
    grid: "grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8",
    surface: "",
    frame: "border",
    stage: "lg:col-span-6 lg:row-span-2",
    chapters: "lg:col-span-6 lg:col-start-7",
    foot: "lg:col-span-6 lg:col-start-7",
  },
};

export function SpecimenPlate({
  id,
  number,
  title,
  locale,
  layout,
  stage,
  endS,
  beatS,
  chapters,
  copy,
  toy,
  caption,
  head,
  foot,
}: {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly locale: Locale;
  readonly layout: PlateLayout;
  /** The stage markup; it fills the driver slot of `id` once mounted. */
  readonly stage: ReactNode;
  readonly endS: number;
  /** Beat ticks on the ruler, and the keyboard step. */
  readonly beatS?: number;
  readonly chapters: readonly SpecimenChapter[];
  readonly copy: PlateCopy;
  /** Only the drawn specimen has a toy; its chapters are words, not code. */
  readonly toy?: PlateToy;
  /** Always-visible line under the stage (with the chapter list, its text equivalent). */
  readonly caption: string;
  /** Number, title and formula, above the stage. */
  readonly head?: ReactNode;
  /** Description, facts and actions. */
  readonly foot?: ReactNode;
}) {
  const stepS = beatS ?? endS / 100;
  const beats = beatS
    ? Array.from({ length: Math.floor(endS / beatS) + 1 }, (_, i) => i * beatS)
    : [];
  const lengths = chapterLengths(chapters, endS);
  const columns = chapters.length > 4 ? 2 : 1;
  const rows = Math.ceil(chapters.length / columns);
  const lastIndex = chapters.length - 1;

  const driverRef = driverSlot(id);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const [ui, setUi] = useState<Ui>("fresh");
  const [toyOn, setToyOn] = useState(false);

  // Everything the frame loop touches lives in one mutable record, so a
  // frame never re-renders React.
  const clock = useRef({
    s: endS,
    mode: "rest" as Mode,
    played: false,
    userPaused: false,
    chapter: lastIndex,
    from: 0,
    to: 0,
    t0: 0,
    ms: 0,
    onDone: null as null | (() => void),
  });

  const render = useCallback(
    (s: number, exact: boolean) => {
      const c = clock.current;
      c.s = s;
      if (playheadRef.current) {
        playheadRef.current.style.transform = `translateX(${((s / endS) * 100).toFixed(3)}%)`;
      }
      const index = chapterIndexAt(chapters, s);
      if (index !== c.chapter && markerRef.current) {
        const col = Math.floor(index / rows);
        markerRef.current.style.transform = `translate(${col * 100}%, ${(index % rows) * 100}%)`;
      }
      if ((exact || index !== c.chapter) && inputRef.current) {
        inputRef.current.value = String(Math.round(s * 1000));
        inputRef.current.setAttribute(
          "aria-valuetext",
          valueText(locale, chapters, s, endS),
        );
      }
      c.chapter = index;
    },
    [chapters, endS, locale, rows],
  );

  const settle = useCallback(
    (mode: Mode) => {
      const c = clock.current;
      c.mode = mode;
      setUi(
        RUNNING.includes(mode)
          ? "running"
          : c.s >= endS - 1e-3
            ? c.played
              ? "done"
              : "fresh"
            : "paused",
      );
    },
    [endS],
  );

  const finish = useCallback(() => {
    const c = clock.current;
    driverRef.current?.pause?.();
    driverRef.current?.seek(endS);
    render(endS, true);
    c.played = true;
    settle("rest");
    getSpecimenConductor().relay();
  }, [driverRef, endS, render, settle]);

  const startPlay = useCallback(
    (fromS: number, now: number) => {
      const c = clock.current;
      c.from = fromS;
      c.t0 = now;
      driverRef.current?.play?.(fromS);
      settle("play");
    },
    [driverRef, settle],
  );

  /**
   * Tape rewind, then play once. The stage holds its frame while the
   * playhead sweeps back to 0 and cuts to the first frame when play starts,
   * so nothing on the stage runs backwards. `holdMs` keeps the rest frame a
   * moment longer before the sweep (autoplay: the visitor sees the result
   * first).
   */
  const rewindAndPlay = useCallback(
    (holdMs = 0) => {
      const c = clock.current;
      const conductor = getSpecimenConductor();
      driverRef.current?.prepare?.();
      if (conductor.reduced || c.s <= 0) {
        render(0, true);
        driverRef.current?.seek(0);
        startPlay(0, performance.now());
      } else {
        c.from = c.s;
        c.t0 = performance.now() + holdMs;
        c.ms = rewindMs(c.s);
        settle("rewind");
      }
      conductor.wake();
    },
    [driverRef, render, settle, startPlay],
  );

  /** Visitor-driven tween to a second, used by the toy button. */
  const tweenTo = useCallback(
    (toS: number, onDone: () => void) => {
      const c = clock.current;
      const conductor = getSpecimenConductor();
      conductor.claim(id);
      c.userPaused = true;
      if (conductor.reduced) {
        driverRef.current?.seek(toS);
        render(toS, true);
        settle(toS >= endS ? "rest" : "paused");
        onDone();
        return;
      }
      c.from = c.s;
      c.to = toS;
      c.t0 = performance.now();
      c.ms = Math.max(500, Math.abs(toS - c.s) * 700);
      c.onDone = onDone;
      settle("tween");
      conductor.wake();
    },
    [driverRef, endS, id, render, settle],
  );

  const pause = useCallback(() => {
    const c = clock.current;
    if (!RUNNING.includes(c.mode)) return;
    driverRef.current?.pause?.();
    // A rewind has not touched the stage yet: stopping it keeps the rest frame.
    if (c.mode === "rewind") {
      render(c.from, true);
      settle(c.from >= endS - 1e-3 ? "rest" : "paused");
      return;
    }
    render(c.s, true);
    settle("paused");
  }, [driverRef, endS, render, settle]);

  /** Scrub, tap and keyboard: the visitor holds the tape. */
  const userSeek = useCallback(
    (s: number, fast: boolean) => {
      const c = clock.current;
      const target = Math.min(Math.max(s, 0), endS);
      if (RUNNING.includes(c.mode)) driverRef.current?.pause?.();
      c.userPaused = true;
      // Once the visitor has moved the tape off the rest frame, coming back
      // to it is a finished take: the button offers to play it again.
      if (target < endS - 1e-3) c.played = true;
      driverRef.current?.seek(target, fast);
      render(target, !fast);
      settle(target >= endS ? "rest" : "paused");
    },
    [driverRef, endS, render, settle],
  );

  useEffect(() => {
    // Visibility is the stage's, not the chapter list's: two stages side by
    // side then measure alike and the newer one starts first.
    const el = surfaceRef.current;
    if (!el) return;
    const conductor = getSpecimenConductor();
    return conductor.register({
      id,
      number,
      el,
      tick(now) {
        const c = clock.current;
        const driver = driverRef.current;
        if (c.mode === "rewind") {
          const t = Math.min(Math.max((now - c.t0) / c.ms, 0), 1);
          render(c.from * (1 - smoothstep(t)), false);
          if (t >= 1) {
            driver?.seek(0);
            startPlay(0, now);
          }
          return true;
        }
        if (c.mode === "play") {
          const s = driver?.time ? driver.time() : c.from + (now - c.t0) / 1000;
          if (s >= endS) {
            finish();
            return false;
          }
          // Films play natively; drawn stages follow the wall clock.
          if (!driver?.time) driver?.seek(s);
          render(Math.max(s, 0), false);
          return true;
        }
        if (c.mode === "tween") {
          const t = Math.min((now - c.t0) / c.ms, 1);
          const s = c.from + (c.to - c.from) * smoothstep(t);
          driver?.seek(s);
          render(s, t >= 1);
          if (t >= 1) {
            settle(c.to >= endS ? "rest" : "paused");
            c.onDone?.();
            c.onDone = null;
            return false;
          }
          return true;
        }
        return false;
      },
      autoplay() {
        if (!RUNNING.includes(clock.current.mode)) rewindAndPlay(AUTOPLAY_HOLD_MS);
      },
      pause,
      resume() {
        const c = clock.current;
        if (c.mode !== "paused" || c.userPaused) return;
        startPlay(c.s, performance.now());
        conductor.wake();
      },
      toRest() {
        driverRef.current?.pause?.();
        driverRef.current?.seek(endS);
        render(endS, true);
        settle("rest");
        setToyOn(false);
      },
      state() {
        const c = clock.current;
        return {
          played: c.played,
          userPaused: c.userPaused,
          running: RUNNING.includes(c.mode),
        };
      },
    });
  }, [driverRef, endS, finish, id, number, pause, render, rewindAndPlay, settle, startPlay]);

  const onPlayButton = () => {
    const c = clock.current;
    const conductor = getSpecimenConductor();
    if (RUNNING.includes(c.mode)) {
      c.userPaused = true;
      pause();
      return;
    }
    conductor.claim(id);
    c.userPaused = false;
    if (c.s >= endS - 1e-3) {
      rewindAndPlay();
    } else {
      driverRef.current?.prepare?.();
      startPlay(c.s, performance.now());
      conductor.wake();
    }
  };

  const onToy = () => {
    if (!toy) return;
    const say = (text: string) => {
      if (liveRef.current) liveRef.current.textContent = text;
    };
    if (toyOn) {
      setToyOn(false);
      tweenTo(endS, () => say(toy.saidBack));
    } else {
      setToyOn(true);
      tweenTo(toy.atS, () => say(toy.saidOn));
    }
  };

  // Pointer: a sideways drag scrubs, a vertical move scrolls the page, a
  // short tap jumps there and holds. The surface rect is read once.
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    left: number;
    width: number;
    scrubbing: boolean;
  } | null>(null);
  const secondAt = (clientX: number) => {
    const d = drag.current;
    if (!d) return 0;
    return (Math.min(Math.max(clientX - d.left, 0), d.width) / d.width) * endS;
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
      left: rect.left,
      width: rect.width,
      scrubbing: false,
    };
    driverRef.current?.prepare?.();
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.scrubbing) {
      const dx = Math.abs(event.clientX - d.x);
      const dy = Math.abs(event.clientY - d.y);
      if (dy > 8 && dy >= dx) {
        drag.current = null;
        return;
      }
      if (dx <= 8) return;
      d.scrubbing = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      rulerRef.current?.setAttribute("data-pressed", "");
    }
    userSeek(secondAt(event.clientX), true);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (d.scrubbing || performance.now() - d.t < 250) {
      userSeek(secondAt(event.clientX), false);
    }
    drag.current = null;
    rulerRef.current?.removeAttribute("data-pressed");
  };
  const onPointerCancel = () => {
    if (drag.current?.scrubbing) userSeek(clock.current.s, false);
    drag.current = null;
    rulerRef.current?.removeAttribute("data-pressed");
  };

  // The range is step="any" so a scrub or tap holds the exact second; every
  // stepping key is ours, so End reaches the rest frame even off the beat grid.
  const onRulerKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const target = rulerKeyTarget(event.key, clock.current.s, stepS, chapters, endS);
    if (target === null) return;
    event.preventDefault();
    userSeek(target, false);
  };

  const label =
    ui === "running" ? copy.pause : ui === "done" ? copy.again : copy.play;
  const detail = layout === "detail";
  const place = PLACE[layout];

  return (
    <div className={place.grid}>
      {head ? <div className="min-w-0">{head}</div> : null}
      <div className={`min-w-0 ${place.stage}`}>
        <div
          ref={surfaceRef}
          data-bleed={layout === "stack" ? "" : undefined}
          className={`specimen-surface select-none ${place.surface}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <div
            aria-hidden="true"
            className={`relative aspect-square w-full overflow-hidden border-foreground bg-[#121212] ${place.frame}`}
          >
            {stage}
          </div>
          <div ref={rulerRef} className="specimen-ruler">
            {beats.map((s) => (
              <span
                key={s}
                aria-hidden="true"
                className="specimen-tick"
                style={{ left: `${(s / endS) * 100}%` }}
              />
            ))}
            {chapters.map((chapter, index) => (
              <span
                key={chapter.label}
                aria-hidden="true"
                className="specimen-tick specimen-tick-major"
                style={{ left: `${(chapter.atS / endS) * 100}%` }}
              >
                {detail ? (
                  <span className="specimen-tick-number">{index + 1}</span>
                ) : null}
              </span>
            ))}
            <span
              ref={playheadRef}
              aria-hidden="true"
              className="specimen-playhead"
              style={{ transform: "translateX(100%)" }}
            />
            <input
              ref={inputRef}
              type="range"
              className="specimen-input"
              min={0}
              max={Math.round(endS * 1000)}
              step="any"
              defaultValue={Math.round(endS * 1000)}
              aria-label={copy.ruler}
              aria-valuetext={valueText(locale, chapters, endS, endS)}
              onFocus={() => driverRef.current?.prepare?.()}
              onInput={(event) =>
                userSeek(Number(event.currentTarget.value) / 1000, false)
              }
              onKeyDown={onRulerKey}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={onPlayButton}
            className="inline-flex min-h-11 min-w-[7.5rem] items-center justify-center border-2 border-foreground bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background"
          >
            {label}
            <span className="sr-only">{`: ${title}`}</span>
          </button>
          {toy ? (
            <button
              type="button"
              aria-pressed={toyOn}
              onClick={onToy}
              className="inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-100 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background active:bg-foreground active:text-background"
            >
              {toyOn ? toy.back : toy.on}
            </button>
          ) : null}
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {copy.hint}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {caption}
        </p>
        {toy ? (
          <p ref={liveRef} aria-live="polite" className="sr-only" />
        ) : null}
      </div>

      <ol
        aria-label={copy.chapters}
        className={`relative grid self-start border-t border-foreground ${place.chapters}`}
        style={{
          gridTemplateRows: `repeat(${rows}, ${ROW_REM}rem)`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoFlow: "column",
        }}
      >
        <span
          ref={markerRef}
          aria-hidden="true"
          className="specimen-marker"
          style={{
            width: `${100 / columns}%`,
            height: `${ROW_REM}rem`,
            transform: `translate(${Math.floor(lastIndex / rows) * 100}%, ${(lastIndex % rows) * 100}%)`,
          }}
        />
        {chapters.map((chapter, index) => (
          <li
            key={chapter.label}
            className="flex min-w-0 items-center justify-between gap-2 border-b border-[var(--color-hairline)] pl-4 pr-2 text-sm"
          >
            <span className={`min-w-0 truncate text-foreground ${toy ? "" : "font-mono"}`}>
              {chapter.label}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatSeconds(locale, lengths[index])}
            </span>
          </li>
        ))}
      </ol>
      {foot ? <div className={`min-w-0 ${place.foot}`}>{foot}</div> : null}
    </div>
  );
}
