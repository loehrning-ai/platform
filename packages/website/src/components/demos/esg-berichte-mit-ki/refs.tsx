import { Fragment, type ReactNode } from "react";

/**
 * Display helpers. The text stays exactly as written; only the way it may
 * wrap changes:
 *  - "Z. 13-14", "lines 3-13": a line reference never breaks
 *  - "560 g", "41,2 MWh", "40 ha": a number never parts from its unit
 *  - "NEEDS CHECK", "NOT FOUND": a status never parts its two words
 *  - "2023-2025", "01.09.2025-30.09.2025": a range never breaks at the hyphen
 *  - file and column names with underscores may break after an underscore
 */
const UNIT = "(?:MWh|kWh|kg|g|ha|t|l|m³|m²|NOK|EUR|MKD|CHF|%)";
const REF = new RegExp(
  [
    "(?:\\bZ\\.|\\bZeilen?|\\blines?)\\s\\d+(?:-\\d+)?",
    "\\b\\d{1,2}\\.\\d{2}\\.\\d{4}\\s?-\\s?\\d{1,2}\\.\\d{2}\\.\\d{4}\\b",
    "\\b\\d{4}-\\d{4}\\b",
    "\\bNEEDS CHECK\\b|\\bNOT FOUND\\b",
    `\\d[\\d.,]*\\s?${UNIT}(?![\\p{L}\\d])`,
    "\\b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\\b",
  ].join("|"),
  "gu",
);

function Piece({ value }: { readonly value: string }) {
  if (value.includes("_")) {
    const segments = value.split("_");
    return (
      <>
        {segments.map((segment, index) => (
          <Fragment key={index}>
            {index > 0 ? "_" : null}
            {index > 0 ? <wbr /> : null}
            {segment}
          </Fragment>
        ))}
      </>
    );
  }
  return <span className="eb-nb">{value}</span>;
}

export function Refs({ text }: { readonly text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(REF)) {
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(<Piece key={start} value={match[0]} />);
    last = start + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</>;
}
