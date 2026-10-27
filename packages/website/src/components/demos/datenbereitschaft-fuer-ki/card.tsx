"use client";

import { GLAS_PRIORITY, GlasPanel } from "@/components/demos/glas";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import type { BoxFill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import type { Fmt } from "./fmt";

/** One box glyph: an empty ring, a half filled ring, a filled disc with a tick (shape, never colour alone). */
export function BoxGlyph({ fill }: { readonly fill: BoxFill }) {
  return (
    <svg viewBox="0 0 16 16" className="w03-glyph" data-fill={fill} aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" className="w03-glyph-ring" />
      {fill === "half" ? <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" className="w03-glyph-fill" /> : null}
      {fill === "full" ? (
        <>
          <circle cx="8" cy="8" r="6.25" className="w03-glyph-fill" />
          <path d="M5 8.2l2 2 4-4.4" className="w03-glyph-tick" />
        </>
      ) : null}
    </svg>
  );
}

/**
 * The card capsule at the top of the stage: "Fragekarte", the five box
 * glyphs and the current answer in one line. A tap opens the card sheet.
 */
export function CardCapsule({
  pack,
  fmt,
  name,
  fills,
  answer,
  onOpen,
  expanded,
}: {
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly name: string;
  readonly fills: readonly BoxFill[];
  /** The answer as it stands, in one line: "75.890 / 85.665 / 128.230, ungeprüft". */
  readonly answer: string;
  readonly onOpen: () => void;
  readonly expanded: boolean;
}) {
  const label = [
    `${pack.strip.open}: ${name}`,
    ...fills.map((fill, index) => fmt.t(pack.strip.glyph, { n: index + 1, name: pack.strip.boxes[index] ?? "", state: pack.strip.states[fill] })),
    answer,
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <GlasPanel material="thin" shape="capsule" live={GLAS_PRIORITY.dock - 1} className="w03-capsule" data-w03-capsule="">
      <button type="button" className="w03-capsule-button" onClick={onOpen} aria-expanded={expanded} aria-label={label}>
        <span className="w03-capsule-name">{name}</span>
        <span className="w03-capsule-glyphs">
          {fills.map((fill, index) => (
            <BoxGlyph key={index} fill={fill} />
          ))}
        </span>
        {answer ? (
          <span className="w03-capsule-answer" data-w03-answer="">
            {answer}
          </span>
        ) : null}
      </button>
    </GlasPanel>
  );
}

/** The answer line of the capsule from the card's state. */
export function answerLine(pack: Pack, fmt: Fmt, values: readonly number[], state: string): string {
  return fmt.t(pack.strip.answer, { values: values.map((value) => fmt.n(value)).join(" / "), state });
}

/** The card in full sentences: what each box says now. */
export function CardSheetBody({ pack, fmt, fills, expected, halfWho = false }: { readonly pack: Pack; readonly fmt: Fmt; readonly fills: readonly BoxFill[]; readonly expected: readonly number[]; readonly halfWho?: boolean }) {
  const values = { apr: fmt.eur(expected[0] ?? 0), may: fmt.eur(expected[1] ?? 0), jun: fmt.eur(expected[2] ?? 0) };
  const sentence = (index: number, fill: BoxFill) => {
    if (fill === "full") return fmt.t(pack.strip.filled[index] ?? "", values);
    if (fill === "half" && index === 0) return pack.strip.halfQuestion;
    if (fill === "half" && index === 2) return halfWho ? pack.strip.halfWho : pack.strip.halfKind;
    return fmt.t(pack.strip.empty, { step: pack.strip.emptySteps[index] ?? 3 });
  };
  return (
    <div className="w03-card-sheet">
      <p className="w03-card-lead">{pack.strip.sheetLead}</p>
      <ol className="w03-card-boxes">
        {fills.map((fill, index) => (
          <li key={index} data-fill={fill}>
            <BoxGlyph fill={fill} />
            <div>
              <h3>
                {index + 1} {pack.strip.boxes[index]}
              </h3>
              <p>{sentence(index, fill)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
