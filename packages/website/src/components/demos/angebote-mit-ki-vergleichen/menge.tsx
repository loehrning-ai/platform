"use client";

import { useRef } from "react";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { REQUEST } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";
import { useDragTo } from "./use-drag";

/** The strip above the Rangliste: "Menge im Jahr: noch offen" until the quantity lands in it. */
export function QtyStrip({ pack, fmt, set, over, stripRef }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly set: boolean; readonly over: boolean; readonly stripRef?: (element: HTMLElement | null) => void }) {
  return (
    <p ref={stripRef} className="av4-strip" data-set={set ? "" : undefined} data-over={over ? "" : undefined} data-av4-strip="">
      {set ? fmt.t(pack.menge.stripSet, { qty: fmt.qty(REQUEST.qty) }) : pack.menge.stripOpen}
    </p>
  );
}

/**
 * Move 2a: the request on paper (fall/anfrage.md, quoted), its "40.000 Stück" a chip to drag onto
 * the strip. A tap or Enter on the chip puts it there too.
 */
export function RequestCard({
  pack,
  fmt,
  set,
  strip,
  onDrop,
  onOver,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly set: boolean;
  readonly strip: () => HTMLElement | null;
  readonly onDrop: () => void;
  readonly onOver: (over: boolean) => void;
}) {
  const chip = useRef<HTMLButtonElement | null>(null);
  const drag = useDragTo<"strip">(
    () => ({ strip: strip() }),
    () => onDrop(),
    (target) => onOver(target === "strip"),
  );
  const rest = REQUEST.qtyQuote.text.slice(REQUEST.qtyChip.text.length);
  return (
    <figure className="av4-paper av4-request" data-av4-request="">
      <figcaption className="av4-paper-kicker">{pack.menge.card}</figcaption>
      <dl className="av4-request-rows">
        <div>
          <dt>{pack.menge.rowQty}</dt>
          <dd>
            {set ? (
              <span className="av4-qty-chip" data-placed="">
                {REQUEST.qtyChip.text}
              </span>
            ) : (
              <button
                ref={chip}
                type="button"
                className="av4-qty-chip"
                aria-label={fmt.t(pack.menge.chip, { qty: fmt.qty(REQUEST.qty) })}
                style={drag.offset ? { transform: `translate(${drag.offset.x}px, ${drag.offset.y}px)` } : undefined}
                data-dragging={drag.offset ? "" : undefined}
                onClick={onDrop}
                data-av4-qty=""
                {...drag.bind}
              >
                {REQUEST.qtyChip.text}
              </button>
            )}
            {rest}
          </dd>
        </div>
        <div>
          <dt>{pack.menge.rowPlace}</dt>
          <dd>{REQUEST.place.text}</dd>
        </div>
      </dl>
    </figure>
  );
}
