"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { INTERNAL, OFFER_KEYS, pallets, TERMS, trips, type OfferKey, type Payer } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";
import { useDragTo } from "./use-drag";

const PAYERS: readonly Payer[] = ["supplier", "buyer"];
const ROUTE_Y: Readonly<Record<OfferKey, number>> = { A: 20, B: 54, C: 88 };

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
    <button
      type="button"
      className="av4-term"
      aria-pressed={selected}
      style={drag.offset ? { transform: `translate(${drag.offset.x}px, ${drag.offset.y}px)` } : undefined}
      data-dragging={drag.offset ? "" : undefined}
      onClick={onSelect}
      data-av4-term={term}
      {...drag.bind}
    >
      {pack.lieferort.chips[term]}
    </button>
  );
}

/** The route schematic and the warehouse: who drives, how often, and where the pallets stand. */
function Routes({ pack, fmt, terms, show }: { readonly pack: DemoPack; readonly fmt: Fmt; readonly terms: Readonly<Record<OfferKey, Payer | null>>; readonly show: OfferKey | null }) {
  const count = show ? pallets(show) : 0;
  const inside = Math.min(count, INTERNAL.freePlaces);
  const outside = Math.max(0, count - INTERNAL.freePlaces);
  const cell = (index: number, x0: number) => ({ x: x0 + (index % 5) * 15, y: 34 + Math.floor(index / 5) * 15 });
  return (
    <svg viewBox="0 0 360 108" className="av4-routes" role="img" aria-label={pack.lieferort.routeLabel} data-av4-routes="">
      {OFFER_KEYS.map((key) => {
        const payer = terms[key];
        const y = ROUTE_Y[key];
        const n = trips(key);
        return (
          <g key={key} data-sorted={payer ? "" : undefined} data-payer={payer ?? undefined} className="av4-route">
            <text x="2" y={y + 4} className="av4-svg-label">
              {TERMS[key].delivery.place === "Brandtwerk" ? pack.offers.A.city : TERMS[key].delivery.place}
            </text>
            <line x1="64" y1={y} x2="180" y2="54" className="av4-route-line" pathLength={1} />
            {payer === "buyer"
              ? Array.from({ length: n }, (_, index) => {
                  const share = (index + 1) / (n + 1);
                  return <rect key={index} x={64 + 116 * share - 5} y={y + (54 - y) * share - 3} width="10" height="6" rx="1.5" className="av4-truck" style={{ "--av4-i": index } as CSSProperties} />;
                })
              : null}
            {payer ? (
              <text x="104" y={y - 4} className="av4-svg-note">
                {payer === "supplier" ? pack.lieferort.included : fmt.t(n === 1 ? pack.lieferort.trip : pack.lieferort.trips, { n })}
              </text>
            ) : null}
          </g>
        );
      })}
      <rect x="180" y="44" width="20" height="20" rx="4" className="av4-plant" />
      <text x="204" y="20" className="av4-svg-label">
        {fmt.t(pack.lieferort.store, { free: INTERNAL.freePlaces })}
      </text>
      {Array.from({ length: INTERNAL.freePlaces }, (_, index) => {
        const { x, y } = cell(index, 206);
        return <rect key={`place-${index}`} x={x} y={y} width="12" height="12" rx="2" className="av4-place" />;
      })}
      <rect x="284" y="30" width="76" height="34" rx="4" className="av4-external" />
      <text x="288" y="78" className="av4-svg-note">
        {pack.lieferort.external}
      </text>
      {Array.from({ length: inside }, (_, index) => {
        const { x, y } = cell(index, 206);
        return <rect key={`in-${show}-${index}`} x={x + 1} y={y + 1} width="10" height="10" rx="1.5" className="av4-pallet" style={{ "--av4-i": index } as CSSProperties} />;
      })}
      {Array.from({ length: outside }, (_, index) => {
        const { x, y } = cell(index, 287);
        return <rect key={`out-${show}-${index}`} x={x + 1} y={y + 1} width="10" height="10" rx="1.5" className="av4-pallet" data-external="" style={{ "--av4-i": index + inside } as CSSProperties} />;
      })}
      {show ? (
        <text x="204" y="100" className="av4-svg-note">
          {fmt.t(pack.lieferort.pallets, { n: count })}
        </text>
      ) : null}
    </svg>
  );
}

/**
 * Move 2c: sort each delivery term into the pocket that says who pays the trip, then watch the route
 * and the pallets. Drag a chip onto a pocket, or tap a chip and then a pocket (also by keyboard).
 * A wrong drop scores nothing: the chip lands in the right pocket, and the pocket quotes the field card.
 */
export function TermsSort({
  pack,
  fmt,
  terms,
  lastKey,
  onSort,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly terms: Readonly<Record<OfferKey, Payer | null>>;
  readonly lastKey: OfferKey | null;
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
    <div className="av4-terms" data-av4-terms="">
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
      <Routes pack={pack} fmt={fmt} terms={terms} show={lastKey} />
    </div>
  );
}
