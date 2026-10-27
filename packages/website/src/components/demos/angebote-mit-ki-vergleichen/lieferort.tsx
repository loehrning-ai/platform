"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { INTERNAL, OFFER_KEYS, pallets, TERMS, trips, type OfferKey, type Payer } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";
import type { TermStage } from "./captions";
import { DragGhost, useDragTo } from "./use-drag";

const PAYERS: readonly Payer[] = ["supplier", "buyer"];
const ROUTE_Y: Readonly<Record<OfferKey, number>> = { A: 22, B: 60, C: 98 };

function TermChip({
  pack,
  term,
  selected,
  pockets,
  onSelect,
  onDrop,
  onOver,
}: {
  readonly pack: DemoPack;
  readonly term: OfferKey;
  readonly selected: boolean;
  readonly pockets: () => Partial<Record<Payer, HTMLElement | null>>;
  readonly onSelect: () => void;
  readonly onDrop: (payer: Payer) => void;
  readonly onOver: (payer: Payer | null) => void;
}) {
  const drag = useDragTo<Payer>(pockets, onDrop, onOver);
  return (
    <>
      <button
        type="button"
        className="av4-term"
        aria-pressed={selected}
        data-dragging={drag.offset ? "" : undefined}
        onClick={onSelect}
        data-av4-term={term}
        {...drag.bind}
      >
        {pack.lieferort.chips[term]}
      </button>
      <DragGhost style={drag.ghost} className="av4-term">
        {pack.lieferort.chips[term]}
      </DragGhost>
    </>
  );
}

/** The route schematic and the warehouse: who drives, how often, and where the pallets stand. */
function Routes({ pack, fmt, terms, show }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly terms: Readonly<Record<OfferKey, Payer | null>>; readonly show: OfferKey | null }) {
  const count = show ? pallets(show) : 0;
  const cellSize = 16;
  const inside = Math.min(count, INTERNAL.freePlaces);
  const outside = Math.max(0, count - INTERNAL.freePlaces);
  const cell = (index: number, x0: number) => ({ x: x0 + (index % 5) * cellSize, y: 40 + Math.floor(index / 5) * cellSize });
  return (
    <svg viewBox="0 0 360 120" className="av4-routes" role="img" aria-label={pack.lieferort.routeLabel} data-av4-routes="">
      {OFFER_KEYS.map((key) => {
        const payer = terms[key];
        const y = ROUTE_Y[key];
        const n = trips(key);
        return (
          <g key={key} data-sorted={payer ? "" : undefined} data-payer={payer ?? undefined} className="av4-route">
            <text x="2" y={y + 4} className="av4-svg-label">
              {TERMS[key].delivery.place === "Brandtwerk" ? pack.offers.A.city : TERMS[key].delivery.place}
            </text>
            <line x1="70" y1={y} x2="176" y2="60" className="av4-route-line" pathLength={1} />
            {payer === "buyer"
              ? Array.from({ length: n }, (_, index) => {
                  const share = (index + 1) / (n + 1);
                  return <rect key={index} x={70 + 106 * share - 6} y={y + (60 - y) * share - 4} width="12" height="8" rx="2" className="av4-truck" style={{ "--av4-i": index } as CSSProperties} />;
                })
              : null}
            {payer ? (
              <text x="96" y={y - 6} className="av4-svg-note">
                {payer === "supplier" ? pack.lieferort.included : fmt.t(n === 1 ? pack.lieferort.trip : pack.lieferort.trips, { n })}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x="176" y="50" width="20" height="20" rx="5" className="av4-plant" />
      <text x="358" y="26" textAnchor="end" className="av4-svg-label">
        {fmt.t(pack.lieferort.store, { free: INTERNAL.freePlaces })}
      </text>
      {Array.from({ length: INTERNAL.freePlaces }, (_, index) => {
        const { x, y } = cell(index, 200);
        return <rect key={`place-${index}`} x={x} y={y} width="13" height="13" rx="3" className="av4-place" />;
      })}
      <rect x="284" y="36" width="76" height="36" rx="6" className="av4-external" />
      <text x="288" y="88" className="av4-svg-note">
        {pack.lieferort.external}
      </text>
      {Array.from({ length: inside }, (_, index) => {
        const { x, y } = cell(index, 200);
        return <rect key={`in-${show}-${index}`} x={x + 1} y={y + 1} width="11" height="11" rx="2" className="av4-pallet" style={{ "--av4-i": index } as CSSProperties} />;
      })}
      {Array.from({ length: outside }, (_, index) => {
        const { x, y } = cell(index, 284);
        return <rect key={`out-${show}-${index}`} x={x + 1} y={y - 3} width="11" height="11" rx="2" className="av4-pallet" data-external="" style={{ "--av4-i": index + inside } as CSSProperties} />;
      })}
      {show ? (
        <text x="200" y="114" className="av4-svg-note">
          {fmt.t(pack.lieferort.pallets, { n: count })}
        </text>
      ) : null}
    </svg>
  );
}

/**
 * Move 2c: sort each delivery term into the pocket that says who pays the trip, then watch the route
 * and the pallets (the trucks first, the pallets once the caption has said what the trips cost). Drag a chip onto a pocket, or tap a chip and then a pocket (also by keyboard).
 * A wrong drop scores nothing: the chip lands in the right pocket, and the pocket quotes the field card.
 */
export function TermsSort({
  pack,
  fmt,
  terms,
  lastKey,
  stage,
  onSort,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly terms: Readonly<Record<OfferKey, Payer | null>>;
  readonly lastKey: OfferKey | null;
  /** The trucks of the last sorted term drive first; its pallets land once the caption moves on. */
  readonly stage: TermStage;
  readonly onSort: (key: OfferKey, payer: Payer) => void;
}) {
  const [selected, setSelected] = useState<OfferKey | null>(null);
  const [over, setOver] = useState<Payer | null>(null);
  const pocketEls = useRef<Partial<Record<Payer, HTMLElement | null>>>({});
  const unsorted = OFFER_KEYS.filter((key) => terms[key] === null);
  const sort = (key: OfferKey, payer: Payer) => {
    setSelected(null);
    onSort(key, payer);
  };
  return (
    // While a sorted term's trucks and pallets arrive, the route moves to the top of the card.
    <div className="av4-terms" data-av4-terms="" data-moving={lastKey && stage !== "done" ? "" : undefined}>
      {unsorted.length > 0 ? (
        <div className="av4-term-tray" role="group" aria-label={pack.lieferort.instruction}>
          {unsorted.map((key) => (
            <TermChip
              key={key}
              pack={pack}
              term={key}
              selected={selected === key}
              pockets={() => pocketEls.current}
              onSelect={() => setSelected((current) => (current === key ? null : key))}
              onDrop={(payer) => sort(key, payer)}
              onOver={setOver}
            />
          ))}
        </div>
      ) : null}
      <div className="av4-pockets">
        {PAYERS.map((payer) => {
          const inside = OFFER_KEYS.filter((key) => terms[key] === payer);
          return (
            <button
              key={payer}
              type="button"
              ref={(element) => {
                pocketEls.current[payer] = element;
              }}
              className="av4-pocket"
              data-over={over === payer ? "" : undefined}
              data-ready={selected ? "" : undefined}
              aria-disabled={selected ? undefined : true}
              onClick={() => {
                if (selected) sort(selected, payer);
              }}
              data-av4-pocket={payer}
            >
              <span className="av4-pocket-title">{payer === "supplier" ? pack.lieferort.supplier : pack.lieferort.buyer}</span>
              {inside.map((key) => (
                <span key={key} className="av4-pocket-item" data-last={lastKey === key ? "" : undefined}>
                  <span className="av4-term" data-placed="">
                    {pack.lieferort.chips[key]}
                  </span>
                  {lastKey === key ? (
                    <span className="av4-pocket-quote">
                      {fmt.t(pack.lieferort.quoted, { text: pack.lieferort.cardQuotes[TERMS[key].delivery.term] })} <span className="av4-from">{pack.lieferort.fromCard}</span>
                    </span>
                  ) : null}
                </span>
              ))}
            </button>
          );
        })}
      </div>
      <Routes pack={pack} fmt={fmt} terms={terms} show={stage === "trucks" && lastKey !== "A" ? null : lastKey} />
    </div>
  );
}
