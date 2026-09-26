import { PROFILE_CONTAINER } from "@/components/about/profile-container";
import { SectionHead } from "@/components/werk/section-head";
import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

/**
 * Career ledger: one hairline row per station under a Kopflinie. The current
 * station is marked by an ink square before its period and a sentence-case
 * "Aktuell" chip in Mennige, the section's one accent; no tinted row.
 */
export function CareerTimeline({ locale }: { readonly locale: Locale }) {
  const copy = PROFILE_COPY[locale].timeline;

  return (
    <section
      id="laufbahn"
      className="py-10 lg:py-14"
      aria-labelledby="career-heading"
      data-proof-ledger
    >
      <div className={PROFILE_CONTAINER}>
        <SectionHead
          id="career-heading"
          title={copy.title}
          caption={copy.eyebrow}
          description={copy.intro}
          size="compact"
        />

        <ol
          aria-label={copy.ariaLabel}
          className="relative mt-6 min-w-0 border-t border-hairline"
        >
          {copy.milestones.map((milestone, index) => {
            const current = index === copy.milestones.length - 1;
            return (
              <li
                key={`${milestone.period}-${milestone.company}`}
                className="grid min-w-0 gap-1 border-b border-hairline py-4 sm:grid-cols-[8rem_minmax(10rem,0.7fr)_minmax(0,1fr)] sm:items-baseline sm:gap-6"
              >
                <p className="flex items-center gap-2 break-words text-label text-muted-foreground tabular-nums [overflow-wrap:anywhere]">
                  {current ? (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 bg-foreground"
                    />
                  ) : null}
                  {milestone.period}
                </p>
                <div className="min-w-0">
                  <h3
                    translate="no"
                    className="break-words text-lg font-bold leading-snug text-foreground [overflow-wrap:anywhere]"
                  >
                    {milestone.company}
                  </h3>
                  <p className="break-words text-[0.9375rem] font-semibold text-foreground [overflow-wrap:anywhere]">
                    {milestone.role}
                  </p>
                  {current ? (
                    <p className="mt-2 inline-flex h-7 items-center border border-brand-orange px-2.5 text-label text-brand-orange">
                      {copy.currentLabel}
                    </p>
                  ) : null}
                </div>
                <p className="min-w-0 break-words text-[0.9375rem] leading-relaxed text-muted-foreground [overflow-wrap:anywhere] max-sm:mt-1">
                  {milestone.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
