import {
  DECK05,
  FACTS_AS_OF,
  NOT_IN_FILES,
  UI,
  W05_FACTS,
  type DemoLocale,
} from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen";

/** "#quellen": every used fact with its source and the dates verbatim, server-rendered. */
export function Sources({ locale }: { readonly locale: DemoLocale }) {
  const copy = UI[locale];
  return (
    <section
      id="quellen"
      aria-labelledby="quellen-heading"
      className="scroll-mt-24 border-t-2 border-scene-line pt-4"
      data-sources=""
    >
      <h2 id="quellen-heading" className="text-fluid-h2 font-bold">
        {copy.sourcesHeading}
      </h2>
      <p className="mt-2 max-w-[64ch] text-body text-muted-foreground">{copy.sourcesIntro}</p>
      <ol className="mt-5 grid max-w-[72ch] gap-0">
        {W05_FACTS.map((fact) => (
          <li
            key={fact.id}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 border-t border-hairline py-3"
            data-fact={fact.id}
          >
            <span className="font-mono text-[0.875rem] font-semibold tabular-nums text-muted-foreground">
              F{fact.id}
            </span>
            <span>
              <span className="block text-[1rem] leading-snug">
                {locale === "de" ? fact.statementDe : fact.statementEn}
              </span>
              <span className="mt-1 block text-[0.875rem] leading-snug text-muted-foreground">
                {fact.source} ·{" "}
                {fact.dates.map((date, i) => (
                  <span key={date}>
                    {i > 0 ? ", " : null}
                    <span className="whitespace-nowrap" data-fact-date="">
                      {date}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </li>
        ))}
        <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 border-t border-hairline py-3" data-fact="deck05">
          <span className="font-mono text-[0.875rem] font-semibold text-muted-foreground">05</span>
          <span className="text-[1rem] leading-snug">{DECK05[locale]}</span>
        </li>
        <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 border-y border-hairline py-3" data-not-in-files="">
          <span aria-hidden="true" className="font-mono text-[0.875rem] font-semibold text-muted-foreground">
            ?
          </span>
          <span className="text-[1rem] leading-snug">{NOT_IN_FILES[locale]}</span>
        </li>
      </ol>
      <p className="mt-4 text-[0.9375rem] font-semibold">{FACTS_AS_OF[locale]}</p>
    </section>
  );
}
