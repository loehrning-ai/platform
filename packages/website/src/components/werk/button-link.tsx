import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph, type ArrowDirection } from "./arrow-glyph";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ink" | "secondary" | "text";
export type ButtonTone = "paper" | "dark" | "scene";

const BUTTON_BASE =
  "group inline-flex min-h-11 items-center gap-2 px-5 text-[0.9375rem] font-semibold transition-colors duration-[120ms] focus-visible:transition-none motion-reduce:transition-none";

const SCENE_PRIMARY =
  "min-h-12 border-2 border-scene-ink bg-scene-ink text-[1.0625rem] text-scene-ground [&>span:first-child]:decoration-2 [&>span:first-child]:underline-offset-4 hover:[&>span:first-child]:underline";

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
 *
 * Scene tone (inside a .plakat-* scope, a poster band): one strong pair, the
 * scene's ink and ground, so it reads right on every palette. Primary is an
 * ink fill with a ground label (Butter on Ultramarin 10.97, Kobalt 6.78,
 * Aubergine 9.74, Creme on Rost 4.80), 17px at 600 for the Rost floor, 48px
 * tall, with a 2px ink edge. Hover never tints (a Rost tint would drop Creme
 * below AA): primary underlines its label, secondary inverts the pair, text
 * thickens its underline. The focus ring is the ink through the scope's
 * --color-brand-orange, 2px off the fill. It appears at once: the colour
 * transition also animates outline-color, so focus-visible:transition-none
 * keeps the ring from fading in from the ground. Never Mennige or text-paper
 * here.
 */
export const BUTTON_CLASSES: Record<ButtonTone, Record<ButtonVariant, string>> = {
  paper: {
    primary: cx(BUTTON_BASE, "bg-mennige text-paper hover:bg-kupfer-dark"),
    ink: cx(BUTTON_BASE, "bg-foreground text-background hover:bg-muted-foreground"),
    secondary: cx(
      BUTTON_BASE,
      "border border-foreground bg-transparent text-foreground hover:bg-card-hover",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground focus-visible:transition-none motion-reduce:transition-none",
  },
  dark: {
    primary: cx(BUTTON_BASE, "bg-dark-fg text-dark-bg hover:bg-[#e8e5de]"),
    ink: cx(BUTTON_BASE, "bg-dark-fg text-dark-bg hover:bg-[#e8e5de]"),
    secondary: cx(
      BUTTON_BASE,
      "border border-dark-border bg-transparent text-dark-fg hover:bg-[#242321]",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 font-semibold text-dark-fg underline decoration-dark-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-dark-fg focus-visible:transition-none motion-reduce:transition-none",
  },
  scene: {
    primary: cx(BUTTON_BASE, SCENE_PRIMARY),
    ink: cx(BUTTON_BASE, SCENE_PRIMARY),
    secondary: cx(
      BUTTON_BASE,
      "min-h-12 border-2 border-scene-ink bg-transparent text-[1.0625rem] text-scene-ink hover:bg-scene-ink hover:text-scene-ground",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 text-[1.0625rem] font-semibold text-scene-ink underline decoration-scene-ink decoration-1 underline-offset-4 transition-colors duration-[120ms] hover:decoration-2 focus-visible:transition-none motion-reduce:transition-none",
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
