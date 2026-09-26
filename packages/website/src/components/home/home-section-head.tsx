import type { ReactNode } from "react";

/**
 * Section head for the home sections below the hero, in the Werkzeichnung
 * grammar: a 2px ink Kopflinie, the heading in one colour, and from lg a
 * factual caption on the right (the section's kicker plus one short note).
 *
 * Below lg the Kopflinie heads the section on its own: the kicker stays for
 * assistive tech only and the introduction steps out, so a phone section
 * opens with its heading and its rows.
 */
export function HomeSectionHead({
  id,
  kicker,
  title,
  introduction,
  note,
}: {
  readonly id?: string;
  /** Sentence-case section label ("Grundlagenpfad"). */
  readonly kicker: string;
  readonly title: ReactNode;
  readonly introduction?: ReactNode;
  /** One factual line under the kicker, from lg only. */
  readonly note?: ReactNode;
}) {
  return (
    <header className="grid gap-x-16 gap-y-3 border-t-2 border-foreground pt-4 max-lg:gap-y-0 max-lg:pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <div className="lg:order-2 lg:text-right">
        <p className="text-label text-muted-foreground max-lg:sr-only">{kicker}</p>
        {note ? (
          <p className="mt-1 text-caption text-muted-foreground max-lg:hidden">{note}</p>
        ) : null}
      </div>
      <div className="min-w-0 lg:order-1">
        <h2
          id={id}
          className="text-fluid-h2 font-bold text-foreground max-lg:text-2xl max-lg:text-balance"
        >
          {title}
        </h2>
        {introduction ? (
          <p className="mt-3 max-w-[56ch] text-body text-muted-foreground text-pretty max-lg:hidden">
            {introduction}
          </p>
        ) : null}
      </div>
    </header>
  );
}
