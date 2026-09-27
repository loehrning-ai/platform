import { Fragment, type ReactNode } from "react";
import { cx } from "@/components/werk/cx";

export type CapsLineProps = {
  readonly children: ReactNode;
  /** A hairline arrow before the text, as on the IDEA poster (the /demos band). */
  readonly arrow?: boolean;
  readonly as?: "p" | "span" | "div";
  readonly className?: string;
};

/**
 * The poster's one line of small spaced caps (`.plakat-caps`): 14px, 600,
 * +0.16em, in the scene ink; 17px and +0.12em in autumn (the Rost rule). Set
 * once per scene as a graphic element, only inside a `.plakat-*` scope or a
 * `[data-plakat-band]`, never as a UI label or on a button. The text stays
 * sentence case in the DOM; CSS sets the capitals, so screen readers and
 * copy-paste get normal words.
 */
export function CapsLine({ children, arrow = false, as: Tag = "p", className }: CapsLineProps) {
  return (
    <Tag className={cx("plakat-caps", arrow && "flex items-center gap-3", className)}>
      {arrow ? (
        <svg
          aria-hidden="true"
          focusable="false"
          data-caps-arrow=""
          width="64"
          height="10"
          viewBox="0 0 64 10"
          className="shrink-0 fill-none stroke-scene-ink"
        >
          <path d="M0 5H62M57.5 1.5L62 5L57.5 8.5" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      ) : null}
      {typeof children === "string" && children.includes(SEPARATOR) ? (
        <CapsSegments text={children} />
      ) : (
        <span>{children}</span>
      )}
    </Tag>
  );
}

const SEPARATOR = " · ";

/**
 * A caps line breaks only between its " · " parts, and never shows a dot at
 * the start or end of a line. Each part is one unbreakable run that opens
 * with its separator in a fixed 1.25em box; the first part opens with an
 * empty box. Every line starts 1.25em left of the clip edge, so the box that
 * opens a line (the empty one, or the dot of a part that wrapped) is clipped
 * and the words sit flush with the title. The DOM text stays the same words
 * and separators ("Workshop 02 · Geschäftsberichte").
 */
function CapsSegments({ text }: { readonly text: string }) {
  return (
    <span className="block min-w-0 overflow-x-clip">
      <span className="-ms-[1.25em] block">
        {text.split(SEPARATOR).map((part, index) => (
          <Fragment key={`${index}-${part}`}>
            {index > 0 ? <wbr /> : null}
            <span className="whitespace-nowrap">
              <span aria-hidden="true" className="inline-block w-[1.25em] text-center tracking-normal">
                {index > 0 ? SEPARATOR : null}
              </span>
              {part}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
