import type { RequestStatus } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/engine";
import type { Verdict } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/model";

const SVG = {
  "aria-hidden": true,
  focusable: false,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "square",
  strokeLinejoin: "miter",
} as const;

export function CheckGlyph({ size = 12 }: { readonly size?: number }) {
  return (
    <svg {...SVG} viewBox="0 0 12 12" width={size} height={size} strokeWidth={2.2}>
      <path d="M2 6.2l2.6 2.6L10 3.4" />
    </svg>
  );
}

/**
 * A verdict is a shape plus a word, never colour alone: a filled square with a
 * check, a half square, a cross, an empty circle.
 */
export function VerdictGlyph({ verdict }: { readonly verdict: Verdict }) {
  switch (verdict) {
    case "correct":
      return (
        <svg {...SVG} viewBox="0 0 22 22" width={22} height={22}>
          <rect x="1" y="1" width="20" height="20" fill="currentColor" stroke="none" />
          <path d="M5.5 11.3l3.6 3.6L16.8 7" stroke="#fffcf5" strokeWidth={2.6} />
        </svg>
      );
    case "rightNumberWrongDef":
      return (
        <svg {...SVG} viewBox="0 0 22 22" width={22} height={22} strokeWidth={2}>
          <rect x="2" y="2" width="18" height="18" />
          <path d="M2 2h9v18H2z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "wrong":
      return (
        <svg {...SVG} viewBox="0 0 22 22" width={22} height={22} strokeWidth={2.8}>
          <path d="M4 4l14 14M18 4L4 18" />
        </svg>
      );
    case "open":
      return (
        <svg {...SVG} viewBox="0 0 22 22" width={22} height={22} strokeWidth={2}>
          <circle cx="11" cy="11" r="8.5" />
        </svg>
      );
  }
}

/** The rail state: empty circle (open), half circle (tried), check square (solved). */
export function StatusGlyph({ status }: { readonly status: RequestStatus }) {
  switch (status) {
    case "open":
      return (
        <svg {...SVG} viewBox="0 0 14 14" width={14} height={14} strokeWidth={1.8}>
          <circle cx="7" cy="7" r="5.5" />
        </svg>
      );
    case "tried":
      return (
        <svg {...SVG} viewBox="0 0 14 14" width={14} height={14} strokeWidth={1.8}>
          <circle cx="7" cy="7" r="5.5" />
          <path d="M7 1.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "solved":
      return (
        <svg {...SVG} viewBox="0 0 14 14" width={14} height={14}>
          <rect x="0.5" y="0.5" width="13" height="13" fill="currentColor" stroke="none" />
          <path d="M3.3 7.2l2.4 2.4 5-5" stroke="#fffcf5" strokeWidth={2} />
        </svg>
      );
  }
}
