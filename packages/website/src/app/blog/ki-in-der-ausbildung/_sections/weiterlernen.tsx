import Link from "next/link";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { localizeHref } from "@/lib/i18n/locale";
import { Rich } from "./rich";
import {
  SectionHead,
  copyFor,
  domainOf,
  otherLanguageNote,
  type SectionProps,
} from "./shared";

/** Course titles, durations and links come from the catalog; only the descriptions are post copy. */
export function Weiterlernen({ locale, context }: SectionProps) {
  const copy = copyFor(locale).weiterlernen;
  const catalog = localizeCatalog(COURSE_CATALOG, locale);
  const courses = copy.courses.map((entry) => {
    const course = catalog.find((item) => item.slug === entry.slug);
    if (!course) throw new Error(`course ${entry.slug} is not in the catalog`);
    return { course, description: entry.description };
  });

  return (
    <section
      className="wz-section"
      id="weiterlernen"
      aria-labelledby="weiterlernen-h"
    >
      <SectionHead id="weiterlernen" index="06" locale={locale} />
      <div className="wz-body">
        <p className="wz-caption">{copy.intro}</p>
        <ul className="wz-rows" role="list">
          {courses.map(({ course, description }) => (
            <li key={course.slug}>
              <Link className="wz-row" href={localizeHref(course.href, locale)}>
                <span className="wz-row__title">{course.title}</span>
                <span className="wz-row__desc">
                  <Rich source={description} context={context} />
                </span>
                <span className="wz-row__meta">{course.duration}</span>
              </Link>
            </li>
          ))}
        </ul>
        <h3 className="wz-subhead">{copy.externalHeading}</h3>
        <ul className="wz-rows" role="list">
          {copy.external.map((row) => {
            const languageNote = otherLanguageNote(locale, row.language);
            return (
              <li key={row.href}>
                <a className="wz-row" href={row.href} hrefLang={row.language}>
                  <span className="wz-row__title">{row.title}</span>
                  <span className="wz-row__desc">
                    <Rich source={row.description} context={context} />
                    {languageNote ? (
                      <span className="wz-row__source">{languageNote}</span>
                    ) : null}
                  </span>
                  <span className="wz-row__meta wz-mono">{domainOf(row.href)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
