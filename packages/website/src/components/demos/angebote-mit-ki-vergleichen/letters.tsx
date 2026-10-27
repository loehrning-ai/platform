"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { GlasButton, GlasSegmented, useGlas } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { OFFER_KEYS, TERMS, type OfferKey } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";

/** The lens: a capsule of glass this wide and high, magnifying 1.5x. */
const LENS_W = 132;
const LENS_H = 76;
const ZOOM = 1.5;
/** Where the lens rests, as a share of the letter's height from its top. */
const LENS_AT = 0.36;
/** How close (px) a line of small print must come to the lens's centre to count as read. */
const HIT = 6;

/** The letter as plain text: markdown stars and heading marks dropped, the lines kept. */
export function plainLetter(markdown: string): string {
  return markdown
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\|\s*|\s*\|$/gm, "")
    .replace(/\s*\|\s*/g, "  ")
    .replace(/^-{3,}(\s+-{3,})*\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function LetterText({ text, quote, found }: { readonly text: string; readonly quote: string; readonly found: boolean }): ReactNode {
  const at = text.indexOf(quote);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="av4-find" data-find="" data-found={found ? "" : undefined}>
        {quote}
      </span>
      {text.slice(at + quote.length)}
    </>
  );
}

/**
 * Move 2d: the three letters on paper (the kit's fall/*.md as written) and one glass lens that reads
 * the small print at 1.5x. The lens stays put over the middle of the letter in view; the letter
 * scrolls under it, the way a reading glass rests on a page you push up. A one-off line that passes
 * the lens's centre is found. The lens is a single duplicate of the text under it, aria-hidden and
 * inert. Phone: one letter at a time, A | B | C in its foot and a swipe on the paper; desktop: all
 * three side by side, and the lens moves to the letter you scroll or point at. "Kleingedrucktes
 * lesen" finds the line without the lens.
 */
export function Letters({
  pack,
  fmt,
  letters,
  finds,
  onFind,
}: {
  readonly pack: DemoPack;
  readonly fmt: Fmt;
  readonly letters: Readonly<Record<OfferKey, string>>;
  readonly finds: readonly OfferKey[];
  readonly onFind: (key: OfferKey) => void;
}) {
  const glas = useGlas();
  const box = useRef<HTMLDivElement | null>(null);
  const texts = useRef<Partial<Record<OfferKey, HTMLDivElement | null>>>({});
  const [active, setActive] = useState<OfferKey>(OFFER_KEYS.find((key) => !finds.includes(key)) ?? "A");
  // Bumped on scroll and resize, so the lens and its twin follow the paper under it.
  const [tick, setTick] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const swipe = useRef<{ id: number; x: number } | null>(null);
  const plain = Object.fromEntries(OFFER_KEYS.map((key) => [key, plainLetter(letters[key])])) as Record<OfferKey, string>;

  // The lens sits at the horizontal middle of the letter in view, at LENS_AT of its height.
  useLayoutEffect(() => {
    const frame = box.current?.getBoundingClientRect();
    const text = texts.current[active]?.getBoundingClientRect();
    if (!frame || !text || text.width === 0) return;
    setLens({ x: text.left - frame.left + text.width / 2, y: text.top - frame.top + text.height * LENS_AT });
  }, [active, tick]);

  useEffect(() => {
    const element = box.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setTick((value) => value + 1));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A one-off line is found once any of its lines crosses the lens's centre.
  const check = (key: OfferKey) => {
    const text = texts.current[key];
    const mark = text?.querySelector("[data-find]");
    if (!text || !mark || finds.includes(key)) return;
    const rect = text.getBoundingClientRect();
    const centre = rect.top + rect.height * LENS_AT;
    for (const line of Array.from(mark.getClientRects())) {
      if (line.top - HIT <= centre && line.bottom + HIT >= centre) {
        onFind(key);
        return;
      }
    }
  };

  const onScroll = (key: OfferKey) => {
    if (key !== active) setActive(key);
    glas.noteDrag();
    setTick((value) => value + 1);
    check(key);
  };

  const swipeDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = { id: event.pointerId, x: event.clientX };
  };
  const swipeUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) < 48) return;
    const index = OFFER_KEYS.indexOf(active) + (dx < 0 ? 1 : -1);
    const next = OFFER_KEYS[Math.max(0, Math.min(OFFER_KEYS.length - 1, index))];
    if (next) setActive(next);
  };

  const readSmallPrint = (key: OfferKey) => {
    const text = texts.current[key];
    const mark = text?.querySelector<HTMLElement>("[data-find]");
    if (text && mark) text.scrollTop = Math.max(0, mark.offsetTop - text.clientHeight * LENS_AT);
    setActive(key);
    onFind(key);
  };

  // The magnified twin of the text under the lens: same width, scaled around the lens centre.
  let twin: ReactNode = null;
  const source = texts.current[active];
  if (lens && source && box.current) {
    const frame = box.current.getBoundingClientRect();
    const rect = source.getBoundingClientRect();
    const cx = frame.left + lens.x - rect.left + source.scrollLeft;
    const cy = frame.top + lens.y - rect.top + source.scrollTop;
    twin = (
      <div
        className="av4-letter-text av4-twin"
        aria-hidden="true"
        inert
        style={{ width: source.clientWidth, transform: `translate(${LENS_W / 2 - cx * ZOOM}px, ${LENS_H / 2 - cy * ZOOM}px) scale(${ZOOM})` }}
      >
        <LetterText text={plain[active]} quote={TERMS[active].oneOff.quote.text} found={finds.includes(active)} />
      </div>
    );
  }

  return (
    <div className="av4-letters-wrap" data-av4-letters="" data-tick={tick}>
      <div ref={box} className="av4-letters" data-active={active}>
        {OFFER_KEYS.map((key) => (
          <article
            key={key}
            className="av4-letter"
            data-key={key}
            data-shown={active === key ? "" : undefined}
            data-found={finds.includes(key) ? "" : undefined}
            aria-label={fmt.t(pack.einmalig.letterLabel, { key, file: TERMS[key].file.split("/").pop() ?? "" })}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && key !== active) setActive(key);
            }}
          >
            <div
              ref={(element) => {
                texts.current[key] = element;
              }}
              className="av4-letter-text"
              onScroll={() => onScroll(key)}
              onPointerDown={swipeDown}
              onPointerUp={swipeUp}
              onPointerCancel={() => {
                swipe.current = null;
              }}
              tabIndex={0}
              data-av4-letter-text={key}
            >
              <LetterText text={plain[key]} quote={TERMS[key].oneOff.quote.text} found={finds.includes(key)} />
            </div>
            <div className="av4-letter-foot">
              {active === key ? (
                <div className="av4-letter-switch">
                  <GlasSegmented
                    label={pack.einmalig.letters}
                    options={OFFER_KEYS.map((option) => ({ value: option, label: finds.includes(option) ? `${option} ✓` : option }))}
                    value={active}
                    onChange={setActive}
                  />
                </div>
              ) : null}
              <span className="av4-badge av4-desk-only" aria-hidden="true">
                {key}
              </span>
              {finds.includes(key) ? (
                <span className="av4-found" data-av4-found={key}>
                  {fmt.money(TERMS[key].oneOff.cents)} · {pack.einmalig.found}
                </span>
              ) : (
                <GlasButton variant="plain" size="compact" onClick={() => readSmallPrint(key)} data-av4-read={key}>
                  {pack.einmalig.read}
                </GlasButton>
              )}
            </div>
          </article>
        ))}
        {lens ? (
          <div className="av4-lens" aria-hidden="true" style={{ transform: `translate(${lens.x - LENS_W / 2}px, ${lens.y - LENS_H / 2}px)` }} data-av4-lens="">
            <div className="av4-lens-glass">{twin}</div>
          </div>
        ) : null}
      </div>
      <p className="av4-hint av4-phone-only">{pack.einmalig.swipe}</p>
    </div>
  );
}
