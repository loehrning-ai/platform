"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useGlas } from "@/components/demos/glas";

/** Below this many pixels a press is a tap, and the element's own click runs. */
const TAP_SLOP = 6;

export interface DragBind {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onClickCapture: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Drags a paper object (opaque, never glass) onto one of several targets. While it moves, a copy of
 * the object (DragGhost) follows the finger at the top of the page, so no card or scroll area clips
 * it; the object itself stays in place as a dashed outline. On release the target under the finger
 * wins, else the copy disappears and nothing changes.
 * A press that moves less than TAP_SLOP is a tap and reaches the element's onClick, so the tap and
 * keyboard paths stay the element's own button behaviour.
 */
export function useDragTo<T extends string>(
  targets: () => Readonly<Partial<Record<T, HTMLElement | null>>>,
  onDrop: (target: T) => void,
  onOver?: (target: T | null) => void,
): { readonly offset: { readonly x: number; readonly y: number } | null; readonly ghost: CSSProperties | null; readonly bind: DragBind } {
  const glas = useGlas();
  const start = useRef<{ id: number; x: number; y: number; moved: boolean; box: DOMRect } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState<{ x: number; y: number; box: DOMRect } | null>(null);

  const hit = (x: number, y: number): T | null => {
    for (const [name, element] of Object.entries(targets()) as [T, HTMLElement | null][]) {
      const box = element?.getBoundingClientRect();
      if (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return name;
    }
    return null;
  };

  const end = (event: PointerEvent<HTMLElement>, drop: boolean) => {
    const current = start.current;
    if (!current || current.id !== event.pointerId) return;
    start.current = null;
    setOffset(null);
    onOver?.(null);
    if (!current.moved) return;
    suppressClick.current = true;
    if (drop) {
      const target = hit(event.clientX, event.clientY);
      if (target) onDrop(target);
    }
  };

  const ghost: CSSProperties | null = offset
    ? { position: "fixed", left: offset.box.left + offset.x, top: offset.box.top + offset.y, width: offset.box.width, height: offset.box.height, margin: 0, zIndex: 80 }
    : null;

  return {
    offset: offset ? { x: offset.x, y: offset.y } : null,
    ghost,
    bind: {
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, box: event.currentTarget.getBoundingClientRect() };
        suppressClick.current = false;
      },
      onPointerMove: (event) => {
        const current = start.current;
        if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.x;
        const dy = event.clientY - current.y;
        if (!current.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
        if (!current.moved) {
          current.moved = true;
          glas.noteDrag();
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        setOffset({ x: dx, y: dy, box: current.box });
        onOver?.(hit(event.clientX, event.clientY));
      },
      onPointerUp: (event) => end(event, true),
      onPointerCancel: (event) => end(event, false),
      onClickCapture: (event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      },
    },
  };
}

/** The dragged copy, at the top of the page (position: fixed), outside every clipping box. */
export function DragGhost({ style, className, children }: { readonly style: CSSProperties | null; readonly className: string; readonly children: ReactNode }) {
  if (!style || typeof document === "undefined") return null;
  return createPortal(
    <span className={`${className} av4-ghost`} style={style} aria-hidden="true">
      {children}
    </span>,
    document.body,
  );
}
