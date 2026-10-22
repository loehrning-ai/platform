import type { CSSProperties } from "react";
import { CoverPoster } from "./cover-poster";
import "./cover-reel.css";

/**
 * The book's cover in miniature, for the shelf row on /buecher: the landing's
 * headline numeral on top and its settled 1.000-square field at the bottom, in
 * a 4:5 Kalkweiß box with a 2px Druckschwarz edge (no radius, no shadow). It is
 * the reel's poster frame, so the reader sees the same picture again after the
 * tap. Static server markup, no motion of its own. Decorative: the row's
 * heading and hook carry the meaning, so the tile is aria-hidden.
 *
 * The numeral is sized to the tile through a container query (about 2.1rem at
 * 104px, about 5.75rem at 18rem; a value longer than "3,8 %" steps down so it
 * never runs past the edge). The field squares take the `cr-sq--*` fills of
 * cover-reel.css, whose colour tokens normally live on `.cr`; the tile sets
 * the same two tokens itself, so it adds no colour of its own.
 */

const FIELD_TOKENS = {
  "--cr-leinen": "var(--color-hairline, #d4cec5)",
  "--cr-accent": "var(--color-brand-orange, #b73a15)",
} as CSSProperties;

export function BookCoverTile({
  value,
  share,
}: {
  /** The headline value as printed on the landing ("3,8 %"), or null for a book without a headline. */
  readonly value: string | null;
  /** The headline share as a fraction (0.038), or null: then the field shows no highlighted squares. */
  readonly share: number | null;
}) {
  return (
    <div
      aria-hidden="true"
      data-book-cover-tile=""
      className="@container aspect-[4/5] w-full min-w-0 overflow-hidden border-2 border-foreground bg-background text-foreground"
      style={FIELD_TOKENS}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-[4cqw] p-[6cqw]">
        {value ? (
          <p
            data-book-tile-numeral=""
            className={`m-0 whitespace-nowrap ${value.length > 5 ? "text-[24cqw]" : "text-[32cqw]"} font-bold leading-[0.88] tracking-[-0.045em] tabular-nums`}
          >
            {value}
          </p>
        ) : (
          <span />
        )}
        <CoverPoster share={share ?? 0} label="" />
      </div>
    </div>
  );
}
