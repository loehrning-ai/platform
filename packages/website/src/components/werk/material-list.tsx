import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph } from "./arrow-glyph";
import { Chip } from "./chip";
import { cx } from "./cx";
import { Pictogram, type PictogramName } from "./pictogram";

export type MaterialRowProps = {
  readonly icon: PictogramName;
  readonly name: ReactNode;
  readonly description?: ReactNode;
  /** Format, language or size as data ("HTML · EN", "ZIP · 1,1 MB"). */
  readonly meta?: ReactNode;
  readonly href: string;
  /** Verb for the row action ("Öffnen", "Laden"). */
  readonly actionLabel: ReactNode;
  readonly external?: boolean;
  readonly download?: boolean | string;
  readonly hrefLang?: string;
  readonly locale?: "de" | "en";
  /** Heading level of the material name. Defaults to h3 under a section h2. */
  readonly headingAs?: "h3" | "h4" | "p";
  readonly className?: string;
};

const NEW_WINDOW: Record<"de" | "en", string> = {
  de: "(öffnet neues Fenster)",
  en: "(opens in a new window)",
};

/**
 * One ledger row for a workshop or course material: pictogram, name,
 * one-line description, meta chip and action. The whole row is one link
 * (stretched ::after on the action), so there is exactly one tab stop and a
 * 44px action target. Hairline below, Bogen-tone hover, no box.
 */
export function MaterialRow({
  icon,
  name,
  description,
  meta,
  href,
  actionLabel,
  external = false,
  download,
  hrefLang,
  locale = "de",
  headingAs: Heading = "h3",
  className,
}: MaterialRowProps) {
  const direction = download ? "down" : external ? "external" : "right";
  const actionClass =
    "col-start-2 inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-foreground underline decoration-border underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover:decoration-foreground sm:col-start-auto sm:self-center";
  const actionContent = (
    <>
      <span>{actionLabel}</span>
      <span className="sr-only">: {name}</span>
      <ArrowGlyph direction={direction} />
      {external ? <span className="sr-only"> {NEW_WINDOW[locale]}</span> : null}
    </>
  );
  const plainAnchor =
    external || download || /^(?:https?:|mailto:)/.test(href) || /\.[a-z0-9]{2,5}(?:[?#].*)?$/i.test(href);

  return (
    <li
      data-material-row=""
      className={cx(
        "group relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-hairline py-5 transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-6",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-orange [&_a:focus-visible]:outline-none",
        className,
      )}
    >
      <Pictogram name={icon} strokeWidth={2} className="mt-0.5 size-8 text-foreground sm:mt-0" />
      <div className="min-w-0">
        <Heading className="text-[1.0625rem] font-bold leading-snug text-foreground">{name}</Heading>
        {description ? (
          <p className="mt-1 max-w-[60ch] text-[0.9375rem] leading-normal text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {meta ? (
        <div className="col-start-2 sm:col-start-auto">
          <Chip>{meta}</Chip>
        </div>
      ) : null}
      {plainAnchor ? (
        <a
          href={href}
          hrefLang={hrefLang}
          className={actionClass}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...(download ? { download: download === true ? "" : download } : {})}
        >
          {actionContent}
        </a>
      ) : (
        <Link href={href} hrefLang={hrefLang} className={actionClass}>
          {actionContent}
        </Link>
      )}
    </li>
  );
}

export type MaterialListProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly "aria-label"?: string;
};

/** List of MaterialRow items with a hairline on top. */
export function MaterialList({ children, className, ...rest }: MaterialListProps) {
  return (
    <ul aria-label={rest["aria-label"]} className={cx("border-t border-hairline", className)}>
      {children}
    </ul>
  );
}
