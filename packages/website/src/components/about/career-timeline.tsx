import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

export function CareerTimeline({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].timeline;

  return (
    <section
      id="laufbahn"
      className="border-t border-border py-12"
      aria-labelledby="career-heading"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(14rem,0.34fr)_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <header className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h2
            id="career-heading"
            className="mt-4 max-w-xl text-pretty text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {copy.intro}
          </p>
        </header>

        <ol
          aria-label={copy.ariaLabel}
          className="grid min-w-0 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-5"
        >
          {copy.milestones.map((milestone, index) => {
            const current = index === copy.milestones.length - 1;
            return (
              <li
                key={`${milestone.period}-${milestone.company}`}
                className={`relative min-w-0 bg-background p-5 sm:p-6 ${
                  current ? "xl:bg-card" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-bold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 ${
                      current ? "bg-brand-orange" : "bg-border"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-10 break-words font-mono text-xs font-bold tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
                  {milestone.period}
                </p>
                <h3
                  translate="no"
                  className={`mt-2 break-words text-xl font-bold tracking-[-0.025em] [overflow-wrap:anywhere] ${
                    current ? "text-brand-orange" : "text-foreground"
                  }`}
                >
                  {milestone.company}
                </h3>
                <p className="mt-2 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                  {milestone.role}
                </p>
                <p className="mt-4 break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {milestone.description}
                </p>
                {current ? (
                  <p className="mt-6 inline-flex border border-brand-orange px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                    {copy.currentLabel}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
