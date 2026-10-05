import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph, type ArrowDirection } from "./arrow-glyph";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ink" | "secondary" | "text";
export type ButtonTone = "paper" | "scene";

const BUTTON_BASE =
  "group inline-flex min-h-11 items-center gap-2 px-5 text-[0.9375rem] font-semibold transition-colors duration-[120ms] focus-visible:transition-none motion-reduce:transition-none";

const SCENE_PRIMARY =
  "min-h-12 border-2 border-scene-button bg-scene-button text-[1.0625rem] text-scene-button-text [&>span:first-child]:decoration-2 [&>span:first-child]:underline-offset-4 hover:[&>span:first-child]:underline";

/**
 * Class recipes, exported for <button> elements that need the same look.
 *
 * Paper tone:
 * - primary: Mennige fill, paper text (5.40:1, hover 7.14:1). One per page.
 *   The colours are unscoped, so the pair stays AA inside a poster scene.
 * - ink: the second strong action once the page's Mennige is used. It is the
 *   old site's Kobalt fill with paper text (7.4:1, hover 9.6:1), never a
 *   black fill: the site has no black grounds, not even on a button.
 * - secondary: ink outline.
 * - text: text link with underline and arrow.
 *
 * There is no dark tone any more: the graphit band is retired.
 *
 * Scene tone (inside a .plakat-* scope, a poster band): the scene's button
 * pair, so it reads right on every palette. Primary is a filled button in
 * `--color-scene-button` with a `--color-scene-button-text` label: the ink
 * where it is light or a clear colour (Butter with an Ultramarin label
 * 10.97, Kobalt with Kreide 6.78, Creme with Rost 4.80), and Terrakotta tief
 * with a Bogen label (6.61) in Bloom, whose Aubergine ink would read as a
 * black button. 17px at 600 for the Rost floor, 48px tall, with a 2px edge
 * in the fill colour. Hover never tints (a Rost tint would drop Creme below
 * AA): primary underlines its label, secondary fills with the button pair,
 * text thickens its underline. The focus ring is the ink through the scope's
 * --color-brand-orange, 2px off the fill. It appears at once: the colour
 * transition also animates outline-color, so focus-visible:transition-none
 * keeps the ring from fading in from the ground. Never Mennige or text-paper
 * here.
 */
export const BUTTON_CLASSES: Record<ButtonTone, Record<ButtonVariant, string>> = {
  paper: {
    primary: cx(BUTTON_BASE, "bg-mennige text-paper hover:bg-kupfer-dark"),
    ink: cx(BUTTON_BASE, "bg-brand-cobalt text-paper hover:bg-[#1e3790]"),
    secondary: cx(
      BUTTON_BASE,
      "border border-foreground bg-transparent text-foreground hover:bg-card-hover",
    ),
    text: "group inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground focus-visible:transition-none motion-reduce:transition-none",
  },
  scene: {
    primary: cx(BUTTON_BASE, SCENE_PRIMARY),
    ink: cx(BUTTON_BASE, SCENE_PRIMARY),
    secondary: cx(
      BUTTON_BASE,
      "min-h-12 border-2 border-scene-ink bg-transparent text-[1.0625rem] text-scene-ink hover:border-scene-button hover:bg-scene-button hover:text-scene-button-text",
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
