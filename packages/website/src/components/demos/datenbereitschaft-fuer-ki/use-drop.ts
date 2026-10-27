"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ESCAPE_PRIORITY, pushEscapeLayer, useGlas } from "@/components/demos/glas";

/** The value of `attr` on the drop target under a screen point, or null. */
export function hit(x: number, y: number, attr: string): string | null {
  if (typeof document === "undefined" || !document.elementsFromPoint) return null;
  for (const element of document.elementsFromPoint(x, y)) {
    const found = element.closest(`[${attr}]`);
    if (found) return found.getAttribute(attr);
  }
  return null;
}

interface Drag {
  readonly id: number;
  readonly item: string;
  readonly x0: number;
  readonly y0: number;
  readonly dx: number;
  readonly dy: number;
}

/** A pointer drag of one item that ends on a drop target, with Escape to cancel. */
export function useDrop(onDrop: (item: string, x: number, y: number) => void) {
  const glas = useGlas();
  const [drag, setDrag] = useState<Drag | null>(null);
  const dropped = useRef(false);
  useEffect(() => {
    if (!drag) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => setDrag(null));
  }, [drag]);
  const handlers = (item: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({ id: event.pointerId, item, x0: event.clientX, y0: event.clientY, dx: 0, dy: 0 });
      glas.noteDrag();
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (!drag || drag.id !== event.pointerId) return;
      setDrag({ ...drag, dx: event.clientX - drag.x0, dy: event.clientY - drag.y0 });
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!drag || drag.id !== event.pointerId) return;
      const moved = Math.hypot(drag.dx, drag.dy) > 8;
      setDrag(null);
      if (moved) {
        dropped.current = true;
        onDrop(item, event.clientX, event.clientY);
      }
    },
    onPointerCancel: () => setDrag(null),
  });
  const styleFor = (item: string) => (drag?.item === item && Math.hypot(drag.dx, drag.dy) > 8 ? { transform: `translate(${drag.dx}px, ${drag.dy}px)`, zIndex: 3 } : undefined);
  /** A click right after a drag is the drag's own release: it must not act as a tap. */
  const tapped = () => {
    if (dropped.current) {
      dropped.current = false;
      return false;
    }
    return true;
  };
  return { handlers, styleFor, tapped, moved: (item: string) => drag?.item === item && Math.hypot(drag.dx, drag.dy) > 8 };
}

