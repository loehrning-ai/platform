import { useRef, type KeyboardEvent, type PointerEvent } from "react";

interface Props {
  /** Horizontal position as a fraction (0..1) of the parent box. */
  readonly at: number;
  /** Vertical position as a fraction (0..1) of the parent box. */
  readonly top: number;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly now: number;
  readonly valueText: string;
  /** Pointer position as a fraction of the parent width, already corrected for the grab offset. */
  readonly onDrag: (fraction: number) => void;
  readonly onDragEnd: () => void;
  readonly onStart?: () => void;
  readonly onKey: (key: string) => boolean;
  /** 0..1..0 one-shot swell. */
  readonly pulse?: number;
  readonly tone?: "ink" | "mark";
}

/**
 * A round, 48 px handle with a 48 x 64 px hit area: role slider, touch-action
 * none on the handle only (the page keeps scrolling everywhere else),
 * arrow/Home/End keys, pointer capture. Hover, focus and press switch to the
 * anti colour of the ground (demo.css).
 */
export function DragHandle({ at, top, label, min, max, now, valueText, onDrag, onDragEnd, onStart, onKey, pulse = 0, tone = "ink" }: Props) {
  const grab = useRef<number | null>(null);

  const box = (event: PointerEvent<HTMLDivElement>) =>
    (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect();

  const down = (event: PointerEvent<HTMLDivElement>) => {
    onStart?.();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = box(event);
    grab.current = event.clientX - (rect.left + at * rect.width);
    event.currentTarget.dataset.drag = "";
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (grab.current === null) return;
    const rect = box(event);
    onDrag((event.clientX - grab.current - rect.left) / rect.width);
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (grab.current === null) return;
    grab.current = null;
    delete event.currentTarget.dataset.drag;
    onDragEnd();
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onKey(event.key)) event.preventDefault();
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={valueText}
      className="mg-handle"
      data-tone={tone}
      style={{ left: `${at * 100}%`, top: `${top * 100}%` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <span className="mg-knob" style={{ transform: `scale(${1 + 0.16 * pulse})` }}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
        </svg>
      </span>
    </div>
  );
}
