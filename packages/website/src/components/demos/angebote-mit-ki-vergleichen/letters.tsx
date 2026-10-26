"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { GlasButton, GlasSegmented, useGlas } from "@/components/demos/glas";
import type { DemoPack } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { OFFER_KEYS, TERMS, type OfferKey } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import type { Fmt } from "./fmt";

const LENS = 96;
const ZOOM = 1.6;

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
 * the small print at 1.6x. The lens is a single duplicate of the letter under it, aria-hidden and
 * inert; the letter itself does not move while the lens is dragged. Crossing a letter's one-off line
 * finds it. Phone: one letter at a time, A | B | C in its foot and a swipe on the paper; desktop: all
 * three side by side. "Kleingedrucktes lesen" finds the line without the lens.
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
  const [lens, setLens] = useState<{ x: number; y: number; key: OfferKey } | null>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const swipe = useRef<{ id: number; x: number } | null>(null);
  const plain = Object.fromEntries(OFFER_KEYS.map((key) => [key, plainLetter(letters[key])])) as Record<OfferKey, string>;

  const letterAt = (clientX: number, clientY: number): OfferKey | null => {
    for (const key of OFFER_KEYS) {
      const rect = texts.current[key]?.getBoundingClientRect();
      if (rect && rect.width > 0 && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) return key;
    }
    return null;
  };

  const place = (clientX: number, clientY: number) => {
    const frame = box.current?.getBoundingClientRect();
    if (!frame) return;
    const key = letterAt(clientX, clientY) ?? lens?.key ?? active;
    setLens({ x: clientX - frame.left, y: clientY - frame.top, key });
    for (const candidate of OFFER_KEYS) {
      const mark = texts.current[candidate]?.querySelector("[data-find]")?.getBoundingClientRect();
      if (mark && clientX >= mark.left - 4 && clientX <= mark.right + 4 && clientY >= mark.top - 6 && clientY <= mark.bottom + 6) {
        if (!finds.includes(candidate)) onFind(candidate);
      }
    }
  };

  const lensDown = (event: PointerEvent<HTMLDivElement>) => {
    const frame = box.current?.getBoundingClientRect();
    if (!frame) return;
    const x = lens?.x ?? LENS / 2 + 8;
    const y = lens?.y ?? LENS / 2 + 8;
    drag.current = { id: event.pointerId, dx: frame.left + x - event.clientX, dy: frame.top + y - event.clientY };
    glas.noteDrag();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.stopPropagation();
  };
  const lensMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    place(event.clientX + current.dx, event.clientY + current.dy);
  };
  const lensUp = () => {
    drag.current = null;
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
    if (next) {
      setActive(next);
      setLens(null);
    }
  };

  // The lens rests at the top right of the letter in view, already magnifying, so it reads as a lens
  // before anyone touches it. It moves back there when another letter comes into view.
  useEffect(() => {
    const frame = box.current?.getBoundingClientRect();
    const text = texts.current[active]?.getBoundingClientRect();
    if (!frame || !text || text.width === 0) return;
    setLens({ x: text.right - frame.left - LENS / 2 - 10, y: text.top - frame.top + LENS / 2 + 6, key: active });
  }, [active]);

  const readSmallPrint = (key: OfferKey) => {
    const text = texts.current[key];
    const mark = text?.querySelector<HTMLElement>("[data-find]");
    if (text && mark) text.scrollTop = Math.max(0, mark.offsetTop - text.clientHeight / 2);
    onFind(key);
  };

  // The magnified twin of the letter under the lens: same width, scaled around the lens centre.
  let twin: ReactNode = null;
  const frame = box.current?.getBoundingClientRect();
  const source = lens ? texts.current[lens.key] : null;
  if (lens && source && frame) {
    const rect = source.getBoundingClientRect();
    const cx = frame.left + lens.x - rect.left + source.scrollLeft;
    const cy = frame.top + lens.y - rect.top + source.scrollTop;
    twin = (
      <div
        className="av4-letter-text av4-twin"
        aria-hidden="true"
        inert
        style={{ width: source.clientWidth, transform: `translate(${LENS / 2 - cx * ZOOM}px, ${LENS / 2 - cy * ZOOM}px) scale(${ZOOM})` }}
      >
        <LetterText text={plain[lens.key]} quote={TERMS[lens.key].oneOff.quote.text} found={finds.includes(lens.key)} />
      </div>
    );
  }

  return (
    <div className="av4-letters-wrap" data-av4-letters="">
      <div ref={box} className="av4-letters" data-active={active}>
        {OFFER_KEYS.map((key) => (
          <article key={key} className="av4-letter" data-key={key} data-shown={active === key ? "" : undefined} data-found={finds.includes(key) ? "" : undefined} aria-label={fmt.t(pack.einmalig.letterLabel, { key, file: TERMS[key].file.split("/").pop() ?? "" })}>
            <div
              ref={(element) => {
                texts.current[key] = element;
              }}
              className="av4-letter-text"
              onPointerDown={swipeDown}
              onPointerUp={swipeUp}
              onPointerCancel={() => {
                swipe.current = null;
              }}
              tabIndex={0}
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
                    onChange={(option) => {
                      setActive(option);
                      setLens(null);
                    }}
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
        <div
          className="av4-lens"
          role="presentation"
          style={{ transform: `translate(${(lens?.x ?? LENS / 2 + 8) - LENS / 2}px, ${(lens?.y ?? LENS / 2 + 8) - LENS / 2}px)` }}
          onPointerDown={lensDown}
          onPointerMove={lensMove}
          onPointerUp={lensUp}
          onPointerCancel={lensUp}
          data-dragging={drag.current ? "" : undefined}
          data-av4-lens=""
        >
          <div className="av4-lens-glass">{twin}</div>
          <span className="sr-only">{pack.einmalig.lens}</span>
        </div>
      </div>
      <p className="av4-hint av4-phone-only">{pack.einmalig.swipe}</p>
    </div>
  );
}
