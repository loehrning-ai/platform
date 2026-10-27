"use client";

import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "@/components/werk/cx";
import { GLAS_PRIORITY } from "./budget";
import { useGlas, useLiveSlot } from "./glas-root";
import { createSpring, type SpringHandle } from "./use-spring";

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** The option index nearest to a pointer x inside the track (pure, for tests). */
export function nearestSegment(x: number, centres: readonly number[]): number {
  let best = 0;
  for (let index = 1; index < centres.length; index += 1) {
    if (Math.abs((centres[index] ?? 0) - x) < Math.abs((centres[best] ?? 0) - x)) best = index;
  }
  return best;
}

/** How much the pill stretches for a pointer speed in px/s (1 to 1.12). */
export function pillStretch(velocity: number): number {
  return 1 + Math.min(0.12, Math.abs(velocity) / 4000);
}

/**
 * SegmentedControl (glass-spec 4.3): 2 to 5 nouns in a capsule, one Bogen
 * pill that slides with the quick spring. Drag across it: the pill follows
 * the finger, stretches with speed, and settles on the nearest option.
 * A radiogroup: arrows move and select, Home and End jump; the demo's global
 * arrow keys leave it alone while it has focus.
 */
export function GlasSegmented<T extends string>({
  options,
  value,
  onChange,
  label,
  glass,
  wrap,
  className,
}: {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** The group's accessible name ("Frage wählen"). */
  readonly label: string;
  /** Thin glass when it stands alone on the field; a fill inside a dock (default). */
  readonly glass?: boolean;
  /** Allow two-line labels. */
  readonly wrap?: boolean;
  readonly className?: string;
}) {
  const { reducedMotion, noteDrag } = useGlas();
  const track = useRef<HTMLDivElement | null>(null);
  const pill = useRef<HTMLSpanElement | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const springs = useRef<{ x: SpringHandle; w: SpringHandle; s: SpringHandle } | null>(null);
  const drag = useRef<{ id: number; lastX: number; lastT: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const isLive = useLiveSlot(track, glass ? GLAS_PRIORITY.panel : false);
  const selected = Math.max(0, options.findIndex((option) => option.value === value));

  const geometry = useCallback(() => {
    const host = track.current;
    if (!host) return [] as { left: number; width: number }[];
    const origin = host.getBoundingClientRect().left;
    return buttons.current.map((button) => {
      const box = button?.getBoundingClientRect();
      return { left: (box?.left ?? 0) - origin, width: box?.width ?? 0 };
    });
  }, []);

  useLayoutEffect(() => {
    const write = () => {
      const element = pill.current;
      const handle = springs.current;
      if (!element || !handle) return;
      element.style.width = `${handle.w.value()}px`;
      element.style.transform = `translateX(${handle.x.value() - 2}px) scaleX(${handle.s.value()})`;
    };
    springs.current = {
      x: createSpring(0, "quick", write),
      w: createSpring(0, "quick", write),
      s: createSpring(1, "bouncy", write),
    };
    return () => {
      springs.current?.x.stop();
      springs.current?.w.stop();
      springs.current?.s.stop();
    };
  }, []);

  // Place the pill on the selected option; first layout and resizes jump.
  const first = useRef(true);
  useLayoutEffect(() => {
    const place = (immediate: boolean) => {
      const box = geometry()[selected];
      if (!box || !springs.current) return;
      springs.current.x.to(box.left, { immediate: immediate || reducedMotion });
      springs.current.w.to(box.width, { immediate: immediate || reducedMotion });
    };
    place(first.current);
    first.current = false;
    if (typeof ResizeObserver === "undefined" || !track.current) return;
    const observer = new ResizeObserver(() => place(true));
    observer.observe(track.current);
    return () => observer.disconnect();
  }, [geometry, reducedMotion, selected, options.length]);

  const select = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowRight: selected + 1, ArrowDown: selected + 1, ArrowLeft: selected - 1, ArrowUp: selected - 1, Home: 0, End: last };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(last, target));
    select(index);
    buttons.current[index]?.focus();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { id: event.pointerId, lastX: event.clientX, lastT: event.timeStamp, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const host = track.current;
    const handle = springs.current;
    if (!state || state.id !== event.pointerId || !host || !handle) return;
    if (!state.moved && Math.abs(event.clientX - state.lastX) < 6) return;
    if (!state.moved) {
      state.moved = true;
      host.setPointerCapture?.(event.pointerId);
      pill.current?.setAttribute("data-dragging", "");
      noteDrag();
    }
    const boxes = geometry();
    const width = handle.w.value();
    const origin = host.getBoundingClientRect().left;
    const min = boxes[0]?.left ?? 0;
    const max = (boxes[boxes.length - 1]?.left ?? 0) + (boxes[boxes.length - 1]?.width ?? 0) - width;
    const x = Math.max(min, Math.min(max, event.clientX - origin - width / 2));
    const dt = Math.max(1, event.timeStamp - state.lastT);
    const velocity = ((event.clientX - state.lastX) / dt) * 1000;
    state.lastX = event.clientX;
    state.lastT = event.timeStamp;
    handle.x.set(x);
    if (!reducedMotion) handle.s.set(pillStretch(velocity));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    suppressClick.current = Boolean(state?.moved);
    if (!state || !state.moved || !track.current || !springs.current) return;
    pill.current?.removeAttribute("data-dragging");
    const boxes = geometry();
    const centre = springs.current.x.value() + springs.current.w.value() / 2;
    const index = nearestSegment(centre, boxes.map((box) => box.left + box.width / 2));
    springs.current.s.to(1, { immediate: reducedMotion });
    const box = boxes[index];
    if (box) springs.current.x.to(box.left, { immediate: reducedMotion });
    select(index);
    event.preventDefault();
  };

  return (
    <div
      ref={track}
      role="radiogroup"
      aria-label={label}
      className={cx("glas-seg", glass && "glas", className)}
      data-material={glass ? "thin" : undefined}
      data-shape={glass ? "capsule" : undefined}
      data-live={glass ? (isLive ? "on" : "off") : undefined}
      data-wrap={wrap ? "" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span ref={pill} className="glas-seg-pill" aria-hidden="true" />
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => {
            buttons.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={index === selected}
          tabIndex={index === selected ? 0 : -1}
          className="glas-seg-option"
          onClick={(event) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              event.preventDefault();
              return;
            }
            select(index);
          }}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
