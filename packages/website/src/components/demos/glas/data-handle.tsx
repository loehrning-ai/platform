"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ESCAPE_PRIORITY, pushEscapeLayer } from "./escape-stack";
import { useGlas } from "./glas-root";

/**
 * The lens on SVG content (glass-spec 6.2): a circle clipped copy of the
 * content with id `contentId`, magnified around (cx, cy). It reads no
 * pixels and costs no backdrop-filter. Put it after the content in the same
 * SVG; the content must not contain the lens itself.
 */
export function SvgLens({
  contentId,
  cx,
  cy,
  r = 36,
  scale = 1.25,
  visible = true,
}: {
  readonly contentId: string;
  readonly cx: number;
  readonly cy: number;
  readonly r?: number;
  readonly scale?: number;
  readonly visible?: boolean;
}) {
  const clip = useId().replace(/:/g, "");
  if (!visible) return null;
  const tx = cx - cx * scale;
  const ty = cy - cy * scale;
  return (
    <g className="glas-lens" aria-hidden="true" pointerEvents="none">
      <clipPath id={`lens-${clip}`}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy + 3} r={r} className="glas-lens-shade" />
      <g clipPath={`url(#lens-${clip})`}>
        <circle cx={cx} cy={cy} r={r} fill="var(--glas-feld-ground, #fffcf5)" />
        <use href={`#${contentId}`} transform={`matrix(${scale} 0 0 ${scale} ${tx} ${ty})`} />
      </g>
      <circle cx={cx} cy={cy} r={r} className="glas-lens-rim" />
    </g>
  );
}

/** Converts a pointer position into the SVG's user units. */
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: clientX, y: clientY };
  const inverse = matrix.inverse();
  return { x: inverse.a * clientX + inverse.c * clientY + inverse.e, y: inverse.b * clientX + inverse.d * clientY + inverse.f };
}

/**
 * DataHandle (glass-spec 4.5): drag the datum itself. A 12px dot with a
 * 44px hit circle; pressed, the caller shows an SvgLens around it. Pointer
 * moves report SVG coordinates; the caller turns them into a value (and
 * clamps). Keyboard: arrows one kit step, Shift+arrows ten (onStep).
 * Escape during a drag calls onCancel with the start point.
 */
export function DataHandle({
  x,
  y,
  label,
  valueText,
  onMove,
  onStep,
  onActiveChange,
  onCommit,
  fill = "currentColor",
  children,
}: {
  readonly x: number;
  readonly y: number;
  /** Accessible name: what this datum is ("Prognose für Woche 12"). */
  readonly label: string;
  /** Its value as a phrase ("140 Gläser"). */
  readonly valueText: string;
  /** A drag moved to this SVG point. */
  readonly onMove: (point: { readonly x: number; readonly y: number }) => void;
  /** Keyboard: dx and dy are -1, 0 or 1; big with Shift. */
  readonly onStep: (dx: number, dy: number, big: boolean) => void;
  readonly onActiveChange?: (active: boolean) => void;
  readonly onCommit?: () => void;
  readonly fill?: string;
  /** Extra marks drawn with the handle (a hairline to the axis). */
  readonly children?: ReactNode;
}) {
  const { noteDrag } = useGlas();
  const group = useRef<SVGGElement | null>(null);
  const pointer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => onActiveChange?.(active), [active, onActiveChange]);
  useEffect(() => {
    if (!active) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      if (start.current) onMove(start.current);
      pointer.current = null;
      setActive(false);
    });
  }, [active, onMove]);

  const svgPoint = (event: PointerEvent<SVGGElement>) => {
    const svg = group.current?.ownerSVGElement;
    return svg ? toSvgPoint(svg, event.clientX, event.clientY) : { x, y };
  };

  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    const steps: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    onStep(step[0], step[1], event.shiftKey);
    onCommit?.();
  };

  return (
    <g
      ref={group}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={valueText}
      className="glas-handle"
      data-active={active ? "" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        group.current?.setPointerCapture?.(event.pointerId);
        pointer.current = event.pointerId;
        start.current = { x, y };
        setActive(true);
        noteDrag();
      }}
      onPointerMove={(event) => {
        if (pointer.current !== event.pointerId) return;
        onMove(svgPoint(event));
      }}
      onPointerUp={(event) => {
        if (pointer.current !== event.pointerId) return;
        pointer.current = null;
        setActive(false);
        onCommit?.();
      }}
      onPointerCancel={() => {
        pointer.current = null;
        setActive(false);
      }}
    >
      {children}
      <circle cx={x} cy={y} r={22} className="glas-handle-hit" />
      <circle cx={x} cy={y} r={6} fill={fill} className="glas-handle-dot" />
    </g>
  );
}
