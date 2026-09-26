import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph, type ArrowDirection } from "./arrow-glyph";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ink" | "secondary" | "text";
export type ButtonTone = "paper" | "dark";

const BUTTON_BASE =
  "group inline-flex min-h-11 items-center gap-2 px-5 text-[0.9375rem] font-semibold transition-colors duration-[120ms] motion-reduce:transition-none";

/**
 * Class recipes, exported for <button> elements that need the same look.
 *
 * Paper tone:
 * - primary: Mennige fill, paper text (5.40:1, hover 7.14:1). One per page.
 *   The colours are unscoped, so the pair stays AA even inside .dark-section.
 * - ink: ink fill for the primary action inside content once the page's
 *   Mennige is used (17.5:1).
 * - secondary: ink outline.
 * - text: text link with underline and arrow.
 *
 * Dark tone (graphit band): primary is a paper button with ink text, never
 * white on the lightened accent (3.18:1 fails); secondary is a paper outline.
 */
export const BUTTON_CLASSES: Record<ButtonTone, Record<ButtonVariant, string>> = {
  paper: {
    primary: cx(BUTTON_BASE, "bg-mennige text-paper hover:bg-kupfer-dark"),
    ink: cx(BUTTON_BASE, "bg-foreground text-background hover:bg-muted-foreground"),
    secondary: cx(
      BUTTON_BASE,
      "border border-foreground bg-transparent text-foreground hover:bg-card-hover",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground motion-reduce:transition-none",
  },
  dark: {
    primary: cx(BUTTON_BASE, "bg-dark-fg text-dark-bg hover:bg-[#e8e5de]"),
    ink: cx(BUTTON_BASE, "bg-dark-fg text-dark-bg hover:bg-[#e8e5de]"),
    secondary: cx(
      BUTTON_BASE,
      "border border-dark-border bg-transparent text-dark-fg hover:bg-[#242321]",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 font-semibold text-dark-fg underline decoration-dark-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-dark-fg motion-reduce:transition-none",
  },
};

const NEW_WINDOW: Record<"de" | "en", string> = {
  de: "(öffnet neues Fenster)",
  en: "(opens in a new window)",
};

export type ButtonLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly tone?: ButtonTone;
  /** Opens in a new window with ↗ and a screen-reader note. */
  readonly external?: boolean;
  /** Marks a file download; `true` keeps the file name, a string renames it. */
  readonly download?: boolean | string;
  /** Show the direction arrow. Defaults to true. */
  readonly arrow?: boolean;
  readonly hrefLang?: string;
  readonly locale?: "de" | "en";
  readonly className?: string;
};

/**
 * Link styled as a Werkzeichnung button. Square, 44px target, visible label.
 * Internal hrefs use next/link; external and download links use <a>.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  tone = "paper",
  external = false,
  download,
  arrow = true,
  hrefLang,
  locale = "de",
  className,
}: ButtonLinkProps) {
  const direction: ArrowDirection = download ? "down" : external ? "external" : "right";
  const classes = cx(BUTTON_CLASSES[tone][variant], className);
  const content = (
    <>
      <span>{children}</span>
      {arrow ? <ArrowGlyph direction={direction} /> : null}
      {external ? <span className="sr-only"> {NEW_WINDOW[locale]}</span> : null}
    </>
  );

  if (external || download || /^(?:https?:|mailto:)/.test(href) || /\.[a-z0-9]{2,5}(?:[?#].*)?$/i.test(href)) {
    return (
      <a
        href={href}
        className={classes}
        hrefLang={hrefLang}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(download ? { download: download === true ? "" : download } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} hrefLang={hrefLang}>
      {content}
    </Link>
  );
}
