"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/components/werk/cx";
import { GLAS_DESKTOP_MIN_WIDTH } from "@/lib/glas";
import { GLAS_PRIORITY } from "./budget";
import { GlasButton } from "./button";
import { ESCAPE_PRIORITY, pushEscapeLayer } from "./escape-stack";
import { useGlas } from "./glas-root";
import { GlasPanel } from "./panel";

/** Drag past this share of its height, or faster than this, and the sheet closes (glass-spec 4.11). */
export const SHEET_DISMISS_SHARE = 0.35;
export const SHEET_DISMISS_SPEED = 500;

/** Pure: does a drag of `dy` px (down is positive) at `velocity` px/s close a sheet of `height`? */
export function shouldDismiss(dy: number, velocity: number, height: number): boolean {
  return dy > height * SHEET_DISMISS_SHARE || velocity > SHEET_DISMISS_SPEED;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(`(min-width: ${GLAS_DESKTOP_MIN_WIDTH}px)`);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return desktop;
}

/**
 * Sheet (glass-spec 4.11). Phone: a bottom sheet inset 8px with a grabber,
 * medium or large detent (large is more opaque and drops its own filter).
 * Desktop: a side sheet on the right. Modal sheets dim the page (no blur on
 * the scrim) and trap focus; non-modal sheets leave the stage usable. Focus
 * moves in and returns to the opener; Escape closes the top sheet.
 */
export function GlasSheet({
  open,
  onClose,
  title,
  children,
  modal = true,
  detent: initialDetent = "medium",
  closeLabel,
  resizeLabel,
  className,
  footer,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly modal?: boolean;
  readonly detent?: "medium" | "large";
  /** "Schließen" / "Close". */
  readonly closeLabel: string;
  /** "Größe ändern" / "Resize": the visually hidden twin of the grabber. */
  readonly resizeLabel: string;
  readonly className?: string;
  readonly footer?: ReactNode;
}) {
  const { portal, reducedMotion } = useGlas();
  const desktop = useIsDesktop();
  const titleId = useId();
  const panel = useRef<HTMLElement | null>(null);
  const opener = useRef<Element | null>(null);
  const [detent, setDetent] = useState(initialDetent);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const drag = useRef<{ id: number; y: number; t: number; dy: number; v: number } | null>(null);
  // The portal node exists only after the root's first commit: render again once mounted.
  const [, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  // Mount, then show next frame (so the spring runs); hide, then unmount after the motion.
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      setMounted(true);
      setDetent(initialDetent);
      const frame = window.requestAnimationFrame(() => setShown(true));
      return () => window.cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), reducedMotion ? 0 : 320);
    const back = opener.current;
    if (back instanceof HTMLElement) back.focus({ preventScroll: true });
    return () => clearTimeout(timer);
  }, [initialDetent, open, reducedMotion]);

  useEffect(() => {
    if (!open || !shown) return;
    const element = panel.current;
    const first = element?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? element)?.focus({ preventScroll: true });
  }, [open, shown]);

  useEffect(() => {
    if (!open) return;
    return pushEscapeLayer(ESCAPE_PRIORITY.sheet, onClose);
  }, [onClose, open]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!modal || event.key !== "Tab") return;
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onGrabDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { id: event.pointerId, y: event.clientY, t: event.timeStamp, dy: 0, v: 0 };
    panel.current?.setAttribute("data-dragging", "");
  };
  const onGrabMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const dy = event.clientY - state.y;
    const dt = Math.max(1, event.timeStamp - state.t);
    state.v = ((dy - state.dy) / dt) * 1000;
    state.dy = dy;
    state.t = event.timeStamp;
    if (panel.current) panel.current.style.transform = `translateY(${Math.max(dy, -40) * (dy < 0 ? 0.3 : 1)}px)`;
  };
  const onGrabUp = () => {
    const state = drag.current;
    drag.current = null;
    const element = panel.current;
    element?.removeAttribute("data-dragging");
    if (element) element.style.transform = "";
    if (!state || !element) return;
    if (state.dy < -40) setDetent("large");
    else if (shouldDismiss(state.dy, state.v, element.getBoundingClientRect().height)) onClose();
    else if (state.dy > 40 && detent === "large") setDetent("medium");
  };

  if (!mounted || !portal.current) return null;
  const place = desktop ? "side" : "bottom";
  return createPortal(
    <>
      {modal ? <div className="glas-sheet-scrim" aria-hidden="true" data-state={shown ? "open" : "closed"} onClick={onClose} /> : null}
      <GlasPanel
        as="section"
        material="thick"
        elevation={3}
        live={GLAS_PRIORITY.sheet}
        role="dialog"
        aria-labelledby={titleId}
        aria-modal={modal ? "true" : undefined}
        panelRef={panel}
        className={cx("glas-sheet", className)}
        data-place={place}
        data-detent={place === "bottom" ? detent : undefined}
        data-state={shown ? "open" : "closed"}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {place === "bottom" ? (
          <div className="glas-sheet-grabber" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
            <span aria-hidden="true" />
            <button type="button" className="sr-only focus:not-sr-only" onClick={() => setDetent(detent === "large" ? "medium" : "large")}>
              {resizeLabel}
            </button>
          </div>
        ) : null}
        <header className="glas-sheet-head">
          <h2 id={titleId} className="glas-sheet-title">
            {title}
          </h2>
          <GlasButton variant="icon" size="compact" icon="close" label={closeLabel} onClick={onClose} data-sheet-close="" />
        </header>
        <div className="glas-sheet-body">{children}</div>
        {footer ? <footer className="glas-sheet-foot">{footer}</footer> : null}
      </GlasPanel>
    </>,
    portal.current,
  );
}
