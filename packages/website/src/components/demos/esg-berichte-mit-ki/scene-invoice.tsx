"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ESCAPE_PRIORITY, GLAS_PRIORITY, GlasPanel, pushEscapeLayer } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { STROM_SCALE, type StromState } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import { scaleUpSeptember } from "@/lib/demo-cases/esg-berichte-mit-ki/figures";
import { SEPTEMBER_INVOICE, STROM, YEAR } from "@/lib/demo-cases/esg-berichte-mit-ki/kit";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { meterCheck } from "@/lib/demo-cases/esg-berichte-mit-ki/rules";
import type { Fmt } from "./fmt";
import invoiceDe from "./invoice-de.webp";
import invoiceEn from "./invoice-en.webp";
import { MonthsChart } from "./months-chart";
import { DocSlot } from "./scene-card";
import { F2Field, invoiceChartParts, rowTextFor } from "./scene-strom";

export const INVOICE_IMAGE = { de: invoiceDe, en: invoiceEn } as const;

const THRESHOLD = 6;

/** The meter self-check in words: new minus old, and whether that matches the invoice. */
export function meterSentence(pack: Pack, fmt: Fmt, invoice: { meterOld: number; meterNew: number; kwh: number }): string {
  const check = meterCheck(invoice.meterOld, invoice.meterNew, invoice.kwh);
  return fmt.t(check.matches ? pack.invoice.meter : pack.invoice.meterMismatch, {
    meterNew: fmt.n(invoice.meterNew),
    meterOld: fmt.n(invoice.meterOld),
    kwh: fmt.n(invoice.kwh),
    difference: fmt.n(check.difference),
  });
}

/**
 * Scene 4: the real invoice photo lies in a tray; the visitor drags it onto
 * the empty September slot (or uses the dock button). It snaps in, checks
 * itself, and the September bar rises from the visitor's guess to 41,2 MWh.
 * It can be taken out again; everything goes back to eleven months.
 */
export function InvoiceScene({
  pack,
  fmt,
  kit,
  strom,
  invoiceIn,
  onInvoice,
  onOpen,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly strom: StromState;
  readonly invoiceIn: boolean;
  readonly onInvoice: (on: boolean) => void;
  readonly onOpen: () => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ x: number; y: number; id: number; moved: boolean } | null>(null);
  const [lift, setLift] = useState<{ dx: number; dy: number; over: boolean } | null>(null);
  const image = INVOICE_IMAGE[fmt.locale];
  const { fill, ghosts } = invoiceChartParts(pack, fmt, strom, invoiceIn, SEPTEMBER_INVOICE.kwh, scaleUpSeptember);

  useEffect(() => {
    if (!lift) return;
    // Escape during the drag: the photo goes back to the tray.
    return pushEscapeLayer(ESCAPE_PRIORITY.drag, () => {
      start.current = null;
      setLift(null);
    });
  }, [lift]);

  const overSlot = (x: number, y: number) => {
    if (typeof document === "undefined") return false;
    const hits = document.elementsFromPoint(x, y);
    return hits.some((element) => element.closest?.("[data-drop]") !== null);
  };

  const readout = invoiceIn
    ? [
        meterSentence(pack, fmt, SEPTEMBER_INVOICE),
        ...(strom.guess !== null ? [fmt.t(pack.invoice.ghostGuess, { v: fmt.n(strom.guess, 1) })] : []),
        fmt.t(pack.invoice.ghostScale),
        fmt.t(pack.invoice.total),
      ]
    : [];

  return (
    <div ref={container} className="w4-s4" data-w4-scene="rechnung" data-in={invoiceIn ? "" : undefined}>
      <div className="w4-s4-top">
        <F2Field pack={pack} fmt={fmt} kit={kit} status={invoiceIn ? "belegt" : "luecke"} value={invoiceIn ? (fmt.figures.mwh12 ?? "") : (fmt.figures.mwh11 ?? "")} />
      </div>
      <div className="w4-s4-chart" data-over={lift?.over ? "" : undefined}>
        <MonthsChart
          rows={STROM}
          year={YEAR}
          t={1}
          scaleMax={STROM_SCALE}
          monthLabels={pack.strom.months}
          label={pack.strom.chartLabel}
          twice={pack.strom.twice}
          rowText={rowTextFor(kit, false)}
          fill={fill}
          ghosts={ghosts}
          dropTarget={!invoiceIn}
        />
      </div>
      {invoiceIn ? null : <DocSlot kicker={pack.strom.slotKicker} name={pack.strom.slot} />}
      <div className="w4-tray" data-w4-tray="" data-empty={invoiceIn ? "" : undefined}>
        <p className="w4-tray-label">{pack.invoice.tray}</p>
        <button
          type="button"
          className="w4-photo"
          data-w4-photo=""
          data-lifted={lift ? "" : undefined}
          data-in={invoiceIn ? "" : undefined}
          aria-label={`${pack.invoice.open}. ${pack.invoice.photoAlt}`}
          style={lift ? { transform: `translate(${lift.dx}px, ${lift.dy}px) rotate(-2deg) scale(1.04)` } : undefined}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            start.current = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false };
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            const begun = start.current;
            if (!begun || begun.id !== event.pointerId) return;
            const dx = event.clientX - begun.x;
            const dy = event.clientY - begun.y;
            if (!begun.moved && Math.hypot(dx, dy) < THRESHOLD) return;
            begun.moved = true;
            setLift({ dx, dy, over: overSlot(event.clientX, event.clientY) });
          }}
          onPointerUp={(event) => {
            const begun = start.current;
            start.current = null;
            if (!begun || begun.id !== event.pointerId) return;
            if (!begun.moved) {
              setLift(null);
              onOpen();
              return;
            }
            const over = overSlot(event.clientX, event.clientY);
            setLift(null);
            if (over) onInvoice(true);
          }}
          onPointerCancel={() => {
            start.current = null;
            setLift(null);
          }}
          onClick={(event) => {
            // Pointer taps open the photo in onPointerUp; the keyboard (detail 0) opens it here.
            if (event.detail === 0) onOpen();
          }}
        >
          <Image src={image} alt="" sizes="(min-width: 64rem) 12rem, 7rem" className="w4-photo-img" draggable={false} />
        </button>
        <p className="w4-tray-name">{kit.invoiceName}</p>
      </div>
      {readout.length > 0 ? (
        <GlasPanel key="in" material="regular" shape="card" live={GLAS_PRIORITY.readout} className="w4-readout w4-readout-steps" data-w4-readout="" data-pop="">
          <div className="w4-readout-body" aria-live="polite">
            {readout.map((sentence, index) => (
              <p key={sentence} style={{ ["--w4-step" as string]: index }} data-w4-total={index === readout.length - 1 ? "" : undefined}>
                {sentence}
              </p>
            ))}
          </div>
        </GlasPanel>
      ) : null}
    </div>
  );
}
