import type { Grade, Status } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

/**
 * Status glyphs as inline SVG (never Unicode, which often has no font on
 * Windows and Android): OK a filled square, NEEDS CHECK a square half filled
 * on the diagonal, NOT FOUND a dashed outline. Always next to the printed
 * status, so they are decoration for assistive technology.
 */
export function StatusGlyph({ status }: { readonly status: Status }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className="eb-glyph"
      data-status={status}
    >
      {status === "ok" ? <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" /> : null}
      {status === "check" ? (
        <>
          <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14 2 L14 14 L2 14 Z" fill="currentColor" />
        </>
      ) : null}
      {status === "notFound" ? (
        <rect
          x="2"
          y="2"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
        />
      ) : null}
    </svg>
  );
}

/** The grade mark beside a grade word: tick, tick with a dot, slash, cross. */
export function GradeGlyph({ grade }: { readonly grade: Grade }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className="eb-glyph"
      data-grade={grade}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      {grade === "right" ? <path d="M2.5 8.5 L6.5 12.5 L13.5 3.5" /> : null}
      {grade === "defensible" ? (
        <>
          <path d="M2.5 8.5 L6.5 12.5 L13.5 3.5" />
          <rect x="11.5" y="11.5" width="3" height="3" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {grade === "half" ? <path d="M3 13 L13 3 M3 8 H8" /> : null}
      {grade === "wrong" ? <path d="M3 3 L13 13 M13 3 L3 13" /> : null}
    </svg>
  );
}
