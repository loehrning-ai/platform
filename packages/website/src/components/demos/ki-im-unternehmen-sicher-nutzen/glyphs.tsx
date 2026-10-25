import { useId } from "react";
import type { Light } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

/* Hard-edged glyphs. Shape carries the meaning, colour never does alone. */
const SVG = { "aria-hidden": true, focusable: false, fill: "none", strokeLinecap: "square", strokeLinejoin: "miter" } as const;

/** Padlock: open lifts the shackle off one side, closed seats it. */
export function LockGlyph({ closed }: { readonly closed: boolean }) {
  return (
    <svg {...SVG} viewBox="0 0 28 32" className="w05-lock" data-closed={closed ? "" : undefined}>
      <path d={closed ? "M8 14V9a6 6 0 0 1 12 0v5" : "M8 14V9a6 6 0 0 1 11-3.3"} stroke="currentColor" strokeWidth="3" />
      <rect x="3" y="14" width="22" height="15" fill="currentColor" />
      <rect x="12.5" y="19" width="3" height="5" fill="var(--w05-bogen)" />
    </svg>
  );
}

export function ArrowGlyph() {
  return (
    <svg {...SVG} viewBox="0 0 20 12" className="w05-arrow">
      <path d="M1 6h16M12 1l5 5-5 5" stroke="currentColor" strokeWidth="2.25" />
    </svg>
  );
}

/** square = red, triangle = amber, circle = green, hatched square = open. */
export function LightGlyph({ light }: { readonly light: Light }) {
  const hatch = `w05-hatch-${useId().replace(/:/g, "")}`;
  return (
    <svg {...SVG} viewBox="0 0 32 32" className="w05-light-glyph" data-light={light}>
      {light === "red" ? <rect x="3" y="3" width="26" height="26" fill="var(--w05-mennige)" stroke="var(--w05-ink)" strokeWidth="2" /> : null}
      {light === "amber" ? <path d="M16 3 30 28H2Z" fill="var(--w05-bernstein)" stroke="var(--w05-ink)" strokeWidth="2" /> : null}
      {light === "green" ? <circle cx="16" cy="16" r="13" fill="var(--w05-tanne)" stroke="var(--w05-ink)" strokeWidth="2" /> : null}
      {light === "open" ? (
        <>
          <defs>
            <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--w05-bogen)" />
              <rect width="2.5" height="6" fill="var(--w05-ink)" />
            </pattern>
          </defs>
          <rect x="3" y="3" width="26" height="26" fill={`url(#${hatch})`} stroke="var(--w05-ink)" strokeWidth="2" />
        </>
      ) : null}
    </svg>
  );
}
