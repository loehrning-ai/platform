import type { ReactNode } from "react";
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
      <span>{typeof children === "string" ? keepSeparators(children) : children}</span>
    </Tag>
  );
}

/**
 * A caps line breaks only after a " · " separator: the space before each dot
 * is a no-break space, so a narrow phone never opens a line with a dot. The
 * DOM text stays one text node, the same words and separators.
 */
function keepSeparators(text: string): string {
  return text.replaceAll(" · ", "\u00a0· ");
}
