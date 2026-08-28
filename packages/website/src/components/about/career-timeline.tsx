import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

export function CareerTimeline({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].timeline;

  return (
    <section
      id="laufbahn"
      className="border-t border-border bg-paper py-10"
      aria-labelledby="career-heading"
      data-proof-ledger
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(13rem,0.3fr)_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <header className="min-w-0">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h2
            id="career-heading"
            className="mt-3 max-w-xl text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground"
          >
            {copy.title}
          </h2>
          <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>
        </header>

        <ol aria-label={copy.ariaLabel} className="relative min-w-0">
          {copy.milestones.map((milestone, index) => {
            const current = index === copy.milestones.length - 1;
            return (
              <li
                key={`${milestone.period}-${milestone.company}`}
                className={`group relative grid min-w-0 gap-2 border-t border-border py-5 pl-8 last:border-b sm:grid-cols-[7rem_minmax(8rem,0.62fr)_minmax(0,1fr)] sm:items-start sm:gap-5 sm:pl-10 ${
                  current ? "bg-brand-acid/35 pr-4" : ""
                }`}
              >
                <span
                  className={`absolute left-0 top-5 flex h-5 w-5 items-center justify-center font-mono text-xs font-bold text-foreground ${
                    current ? "bg-brand-acid" : "bg-brand-lilac/80"
                  }`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="break-words font-mono text-xs font-bold tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
                  {milestone.period}
                </p>
                <div className="min-w-0">
                  <h3
                    translate="no"
                    className={`break-words text-lg font-bold tracking-[-0.025em] [overflow-wrap:anywhere] ${
                      current ? "text-brand-orange" : "text-foreground"
                    }`}
                  >
                    {milestone.company}
                  </h3>
                  <p className="mt-1 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                    {milestone.role}
                  </p>
                  {current ? (
                    <p className="mt-2 inline-flex border border-brand-orange px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                      {copy.currentLabel}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-w-0 max-w-full items-start gap-4">
                  <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                    {milestone.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
