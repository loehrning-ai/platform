"use client";

import { useId, useState, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { GlasPanel } from "./panel";
import { GLAS_PRIORITY } from "./budget";

/**
 * Readout (glass-spec 4.8): a number or a short sentence on thin glass (one
 * line) or regular glass (two lines), springing out of its anchor. Keyed by
 * `popKey`: a new key pops it again. aria-hidden when it repeats a slider's
 * aria-valuetext.
 */
export function GlasReadout({
  children,
  lines = 1,
  popKey,
  hidden,
  className,
  live = GLAS_PRIORITY.readout,
}: {
  readonly children: ReactNode;
  readonly lines?: 1 | 2;
  readonly popKey?: string | number;
  /** aria-hidden (the value is already spoken elsewhere). */
  readonly hidden?: boolean;
  readonly className?: string;
  readonly live?: number | false;
}) {
  return (
    <GlasPanel
      key={popKey}
      as="span"
      material={lines === 2 ? "regular" : "thin"}
      shape="fixed"
      live={live}
      className={cx("glas-readout", className)}
      data-lines={lines === 2 ? "2" : undefined}
      data-pop={popKey === undefined ? undefined : ""}
      aria-hidden={hidden ? "true" : undefined}
    >
      {children}
    </GlasPanel>
  );
}

/**
 * Tooltip: a readout on hover and focus of its trigger, flipping below near
 * the top. It describes the trigger (aria-describedby); never the only place
 * information lives.
 */
export function GlasTooltip({
  content,
  children,
  side = "above",
}: {
  readonly content: ReactNode;
  readonly children: (describedBy: string) => ReactNode;
  readonly side?: "above" | "below";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="glas-tooltip-wrap"
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children(id)}
      <span id={id} role="tooltip" className="glas-tooltip" data-side={side} hidden={!open}>
        <GlasReadout live={false} popKey={open ? 1 : 0}>
          {content}
        </GlasReadout>
      </span>
    </span>
  );
}
