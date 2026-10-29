import Link from "next/link";
import type { ReactNode } from "react";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { workshopObjective } from "@/lib/workshop-objectives";

interface Props {
  readonly slug: string;
  readonly locale: Locale;
}

/**
 * "Lernziel": the one sentence the workshop teaches and its three-line card,
 * the same words the demo and the kit use (src/lib/workshop-objectives.ts).
 * Always open, nothing collapses. Renders nothing for a workshop without an
 * entry.
 */
export function WorkshopObjective({ slug, locale }: Props): ReactNode {
  const entry = workshopObjective(slug, locale);
  if (!entry) return null;
  return (
    <section
      aria-labelledby="workshop-objective-heading"
      data-workshop-objective=""
      className="mx-auto max-w-[75rem] px-4 pt-6 sm:px-6 sm:pt-8"
    >
      <div className="border-t-2 border-scene-line pt-4 sm:grid sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-x-10 sm:pt-5">
        <h2 id="workshop-objective-heading" className="text-[1.25rem]/[1.2] font-bold text-foreground">
          {entry.label}
        </h2>
        <div className="mt-2 sm:mt-0">
          <p data-objective-sentence="" className="max-w-[58ch] text-[1.0625rem]/[1.5] font-semibold text-foreground text-pretty">
            {entry.objective}
          </p>
          <figure className="mt-3 max-w-[58ch] border-[1.5px] border-foreground bg-background">
            <ol data-objective-card="" className="m-0 list-none p-0">
              {entry.card.map((line, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 border-b border-hairline px-3 py-2 text-[0.9375rem]/[1.45] text-foreground last:border-b-0"
                >
                  <span aria-hidden="true" className="font-bold tabular-nums text-mennige">
                    {index + 1}
                  </span>
                  {/* A no-break space before each " · " keeps the dot on the line before it. */}
                  <span className="text-pretty">{line.replace(/ · /g, "\u00a0· ")}</span>
                </li>
              ))}
            </ol>
            <figcaption className="border-t-[1.5px] border-foreground px-3 py-1.5 text-[0.875rem]/[1.4] text-foreground/80">
              {entry.cardSource}
            </figcaption>
          </figure>
          {entry.related ? (
            <p className="mt-1">
              <Link
                href={localizeHref(entry.related.href, locale)}
                data-objective-related=""
                className="inline-block py-3 text-[0.9375rem]/[1.4] font-semibold text-foreground text-pretty underline decoration-mennige decoration-2 underline-offset-4 hover:text-mennige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {entry.related.label}
                <span aria-hidden="true">{"\u00a0→"}</span>
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
