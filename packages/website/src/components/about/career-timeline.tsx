import { EmployerMarkGlyph } from "@/components/about/employer-marks";
import { PROFILE_CONTAINER } from "@/components/about/profile-container";
import { SectionHead } from "@/components/werk/section-head";
import type { Locale } from "@/lib/i18n/locale";
import { PROFILE_COPY } from "@/lib/i18n/profile-copy";

/**
 * Career ledger: one hairline row per station under a Kopflinie, newest
 * first, so the current role opens the list. The current station is marked
 * once, in its period cell: an ink square and the word "Aktuell" in Mennige,
 * the section's one accent. Former employers carry their ink mark after the
 * name, and one caption under the ledger states that the marks are
 * biography, not endorsement.
 *
 * From sm each row is period | company and role | description. Below sm the
 * role joins the period on one label line above the company name, so a
 * phone row is three lines, not four.
 */
export function CareerTimeline({ locale }: { readonly locale: Locale }) {
  const profile = PROFILE_COPY[locale];
  const copy = profile.timeline;
  const milestones = [...copy.milestones].reverse();
  const since = copy.milestones[0]?.period;
  const caption = since
    ? locale === "de"
      ? `${since} bis heute`
      : `${since} to today`
    : undefined;

  return (
    <section
      id="laufbahn"
      className="py-8 lg:py-10"
      aria-labelledby="career-heading"
      data-proof-ledger
    >
      <div className={PROFILE_CONTAINER}>
        <SectionHead
          id="career-heading"
          title={copy.title}
          caption={caption}
          size="compact"
          className="max-sm:[&>div>p]:hidden"
        />

        <ol
          aria-label={copy.ariaLabel}
          className="relative mt-6 min-w-0 border-t border-hairline"
        >
          {milestones.map((milestone, index) => {
            const current = index === 0;
            return (
              <li
                key={`${milestone.period}-${milestone.company}`}
                data-current={current ? "" : undefined}
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-1.5 border-b border-hairline py-3 [grid-template-areas:'period_role''company_company''desc_desc'] sm:grid-cols-[8rem_minmax(10rem,0.7fr)_minmax(0,1fr)] sm:gap-x-6 sm:py-4 sm:[grid-template-areas:'period_company_desc''period_role_desc']"
              >
                <p className="flex flex-wrap items-baseline gap-x-1.5 self-start text-label text-muted-foreground tabular-nums [grid-area:period]">
                  {current ? (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 self-center bg-foreground"
                    />
                  ) : null}
                  <span className="whitespace-nowrap">{milestone.period}</span>
                  {current ? (
                    // Phone: one line ("■ Seit 2026 · Aktuell · Kurator").
                    // From sm: "Aktuell" on its own line under the period.
                    <span className="whitespace-nowrap sm:basis-full sm:pl-3.5">
                      <span aria-hidden="true" className="sm:hidden">
                        ·{" "}
                      </span>
                      <span className="text-brand-orange">
                        {copy.currentLabel}
                      </span>
                    </span>
                  ) : null}
                </p>
                <h3
                  translate="no"
                  className="flex min-w-0 items-center gap-2 break-words text-lg font-bold leading-snug text-foreground [grid-area:company] [overflow-wrap:anywhere] max-sm:mt-0.5"
                >
                  {milestone.company}
                  <EmployerMarkGlyph company={milestone.company} />
                </h3>
                <p className="min-w-0 break-words text-label text-muted-foreground [grid-area:role] [overflow-wrap:anywhere] sm:text-[0.9375rem] sm:font-semibold sm:leading-snug sm:tracking-normal sm:text-foreground">
                  <span aria-hidden="true" className="mr-1.5 sm:hidden">
                    ·
                  </span>
                  {milestone.role}
                </p>
                <p className="mt-1 min-w-0 break-words text-[0.9375rem] leading-relaxed text-muted-foreground [grid-area:desc] [overflow-wrap:anywhere] sm:mt-0">
                  {milestone.description}
                </p>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 max-w-[64ch] text-caption text-muted-foreground text-pretty">
          {profile.stations.notice}
        </p>
      </div>
    </section>
  );
}
