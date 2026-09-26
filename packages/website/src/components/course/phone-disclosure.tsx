"use client";

import { useState, type JSX, type ReactNode } from "react";

interface PhoneDisclosureProps {
  /** id of the collapsible region, for `aria-controls`. */
  readonly id: string;
  /** Visible text of the toggle row, in sentence case. */
  readonly label: string;
  /**
   * Optional second line under the label (13px, muted), for example the
   * intro of a section whose visible heading is hidden below lg. It
   * describes the row rather than naming it.
   */
  readonly hint?: string;
  readonly children: ReactNode;
}

/**
 * Collapses a large instrument into one row below lg and changes nothing
 * from lg up.
 *
 * The collapsed state is plain CSS on markup the server renders: the region
 * carries `max-lg:hidden` until the row is pressed, and the row itself is
 * `lg:hidden`. Nothing is measured and nothing flips at hydration, so the
 * desktop layout is identical on the first paint and phones never see the
 * instrument appear and then vanish. The content keeps its place in the
 * document, so reading and focus order match what is shown.
 *
 * The row needs scripting, so it carries `js-shell-only`; the instruments it
 * wraps are client components that need scripting as well.
 */
export function PhoneDisclosure({
  id,
  label,
  hint,
  children,
}: PhoneDisclosureProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  return (
    <div data-phone-disclosure={open ? "open" : "closed"}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-labelledby={hint ? labelId : undefined}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="js-shell-only flex min-h-12 w-full items-center justify-between gap-4 border-y border-hairline text-left text-label text-foreground transition-colors duration-[120ms] hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none lg:hidden"
      >
        {hint ? (
          <span className="min-w-0 py-2">
            <span id={labelId} className="block">
              {label}
            </span>
            <span
              id={hintId}
              className="mt-0.5 block text-[13px] font-normal leading-snug tracking-normal text-muted-foreground"
            >
              {hint}
            </span>
          </span>
        ) : (
          label
        )}
        <span
          aria-hidden="true"
          className="w-4 shrink-0 text-center leading-none tabular-nums"
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div id={id} className={open ? "mt-4 lg:mt-0" : "max-lg:hidden"}>
        {children}
      </div>
    </div>
  );
}
